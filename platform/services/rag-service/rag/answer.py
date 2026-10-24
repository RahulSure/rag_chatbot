"""
Article-level answering.

Chunks are only used to *find* relevant material. The model is then given each
matching web article whole (from the `web_articles` collection) or each book
passage, clearly separated, so mantras and procedures are never stitched
together from different sources. Every mantra in the reply is checked against
the source text: anything not found verbatim in a single source triggers one
stricter retry, and is removed if it still doesn't match.
"""

from __future__ import annotations

import logging
import os
import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("sadhak.answer")

MAX_SOURCES = 5          # distinct articles / book passages handed to the model
ARTICLE_CHARS = 6000     # per web article; longer ones are windowed around the match
WEB_ARTICLES = "web_articles"
ANSWER_TEMPERATURE = 0.2
# gpt-oss is a reasoning model: hidden reasoning tokens count against max_tokens,
# so multi-procedure answers need far more than the wrapper's default of 1024.
ANSWER_MAX_TOKENS = 4096

ASK_MARKER = "[[ASK]]"

PROMPT = """You are Sadhak, a caring spiritual companion (kalyan-mitra) for seekers, grounded in the teachings of Dr. Narayan Dutt Shrimali (Paramhans Swami Nikhileshwaranand) — from his books and from articles by his disciples.

Below are SOURCES. Each one is a separate book passage or a complete article.

BE A COMPANION:
- Speak to the user personally and warmly. Acknowledge what they share about their life and feelings, and remember details from the conversation.
- Never claim psychic or supernatural powers, never predict outcomes, and never promise results.

ASK BEFORE PRESCRIBING:
- If the user asks for a mantra or sadhana for a personal goal (attraction or vashikaran, love or marriage, money or Lakshmi, enemies or court cases, health, job, protection, children and so on) and the conversation does not yet tell you (1) their purpose and situation, (2) who it is for, and (3) whether they are new to sadhana or experienced, and whether they have guru diksha — do not give any mantra yet. Reply with a short, warm acknowledgement and 2-3 simple questions to understand them. Begin that reply with the exact marker {ask_marker} on its own first line.
- Use everything the user already told you earlier in the conversation (for whom, their experience, diksha). Ask only about what is still unknown — often just one question.
- Ask only once per request. If they already gave these details, ask you to just tell them, or ask a knowledge question (what is it, its meaning or history), answer directly.

PERSONALISE:
- Once you know their situation, choose from the sources the mantra(s) and procedure(s) that suit it best: for a beginner, prefer the simpler and shorter practice and suggest seeking diksha and guidance; for an experienced sadhak you may give the more advanced method. Say in a sentence why it suits them.
- For each mantra, explain what it is for and its benefits as the source describes them, in your own words. If the source does not state benefits, give its traditional purpose briefly. Never promise guaranteed results or cures.
- End with a short, caring line of guidance or encouragement for their situation.

VASHIKARAN AND ATTRACTION:
- If the request targets a specific person who does not reciprocate or is not in a relationship with the user (an ex, someone who said no, someone married to another, a boss or colleague to control), do not give a mantra to bind or control that person. Respond with compassion for their feelings and offer, from the sources, practices for the user's own peace, confidence and personal magnetism.
- For general attraction or charisma, or harmony in the user's own willing relationship, the sources' methods may be given.

MANTRAS AND PROCEDURES — STRICT:
1. Copy every mantra character for character from ONE source, exactly as written there: same words, same bija, same spelling. Never combine, shorten, extend or "correct" a mantra, and never mix parts of different sources.
2. Never write a mantra that does not appear in the sources.
3. If several sources give different mantras or methods for the question, present each one separately, under its own short heading (the source's title), with its own mantra and its own procedure.
4. Write each procedure faithfully: the same steps in the same order, with the same counts, mala, days, timings, direction, asana, materials and offerings. Do not add, drop or change any step, and do not invent details the source doesn't state.
5. If no source contains a mantra or procedure for the question, say so plainly. You may explain the topic in general terms, but do not make up a mantra or method.

EXPLANATION AND STYLE:
- Introductions and explanations can be in your own words: warm, natural and concise.
- Reply in the SAME language as the USER'S QUESTION, not the language of the sources. Mantras always stay in Devanagari exactly as in the source; in an English answer you may add a transliteration after the Devanagari mantra.
- Plain text only: no markdown symbols such as ** or #. Use short headings on their own line and numbered steps (1. 2. 3.).
- Never mention website names or URLs. For book passages you may mention the book and page briefly in parentheses.
- Never refer to the sources themselves: no "Source 2", no "as given in the source", "the article says" or "the website". Present the teaching directly.
- If no source is relevant at all, answer briefly from general knowledge of the tradition, without claiming it comes from the books.
- If the topic involves tantra, sadhana or attraction practices, end with ONE sentence that such practices should be done under a qualified guru's guidance.
- For vashikaran, mohan, uchchatan, maran or similar influence rituals, and for parad (mercury) sadhana or alchemy, add ONE short warning line that these must be done only under a qualified, experienced guru. Never give steps for heating, processing or consuming mercury — it is highly toxic; explain the significance instead.

CONVERSATION SO FAR:
{history}

SOURCES:
{sources}
{pending}
USER'S MESSAGE: {question}

Write the whole answer in {language} (mantras stay in Devanagari exactly as in the source).
Your answer:"""

RETRY_NOTE = """

IMPORTANT: a previous draft contained mantra text that does not appear exactly in any single source:
{bad}
Write the answer again. Copy each mantra exactly from one source, or leave it out if the sources don't contain it."""


@dataclass
class Source:
    title: str
    text: str
    is_web: bool
    book: str | None = None
    page: int | None = None
    topic: str | None = None
    url: str | None = None
    snippet: str = ""


# ── Retrieval ───────────────────────────────────────────────────────────────

@lru_cache(maxsize=4)
def _retriever(top_k: int):
    from llama_index.core import Settings, VectorStoreIndex
    from rag.embeddings import get_embedding_model
    from rag.vector_store import get_vector_store

    Settings.embed_model = get_embedding_model()
    return VectorStoreIndex.from_vector_store(get_vector_store()).as_retriever(similarity_top_k=top_k)


@lru_cache(maxsize=1)
def _llm():
    from llm.krutrim_llm import OurLLM

    return OurLLM(
        api_key=os.getenv("KRUTRIM_API_KEY", ""),
        model_name=os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
    )


def _full_articles(urls: list[str]) -> dict[str, dict]:
    if not urls:
        return {}
    from rag.vector_store import MONGODB_DB_NAME, _get_mongo_client

    coll = _get_mongo_client()[MONGODB_DB_NAME][WEB_ARTICLES]
    return {doc["_id"]: doc for doc in coll.find({"_id": {"$in": urls}})}


def _window(full: str, matched_chunk: str) -> str:
    """Whole article when it fits, otherwise a window that starts just before the matched chunk."""
    if len(full) <= ARTICLE_CHARS:
        return full
    pos = full.find(matched_chunk[:150].strip())
    start = max(0, pos - 1500) if pos >= 0 else 0
    return full[start : start + ARTICLE_CHARS]


# ── Spelling-proof keyword matching ─────────────────────────────────────────
#
# Titles and questions spell the same word many ways: soundarya / saundarya / सौंदर्य / सौन्दर्य,
# laxmi / लक्ष्मी. Each word is reduced to a consonant "skeleton" (Devanagari is transliterated
# to Roman first), so all of those become the same key ("sndry", "lkshm").

def _skeleton(word: str) -> str:
    if re.search(r"[ऀ-ॿ]", word):
        from indic_transliteration import sanscript

        word = sanscript.transliterate(word, sanscript.DEVANAGARI, sanscript.ITRANS)
        # anusvara and nasal consonants all read as "n"; visarga is dropped
        word = word.replace("M", "n").replace(".N", "n").replace("~N", "n").replace("JN", "n").replace("H", "")
    word = word.lower().replace("x", "ksh").replace("w", "v").replace("z", "j").replace("q", "k")
    word = re.sub(r"[aeiou]", "", re.sub(r"[^a-z]", "", word))
    return re.sub(r"(.)\1+", r"\1", word)


def _skeletons(text: str) -> set[str]:
    return {sk for w in re.findall(r"[\wऀ-ॿ]+", text) if len(sk := _skeleton(w)) >= 3}


# Words too common to identify a topic: "mantra", "sadhana", question words, and the
# conversational words people use in follow-ups ("I'm a beginner, how many days …").
_STOPWORDS = (
    "का की के को और में से है हैं क्या कैसे करें करे बताइए बताओ बताएं मंत्र मन्त्र साधना विधि प्रयोग लिए "
    "कोई मुझे दीजिए चाहिए जानकारी मैं हूँ हूं नया नई नए साधक अपने अपना अपनी दिन कितने कितना समय शुरू "
    "अनुभवी पहले बाद अभी सकता सकती लाभ फायदे फायदा अच्छा सबसे "
    "mantra mantras sadhana sadhna method vidhi for and the how what with please tell about procedure "
    "give want need chant chanting which there this that from myself self beginner beginners new experienced "
    "sadhak days day many much should could would time times long start started help life problem more "
    "also does doing done before after now yet still been have has had will can into your their them "
    "best good better benefit benefits"
)
_STOP_SKELETONS = _skeletons(_STOPWORDS)
GENERIC_TITLE_DF = 100  # a word in more titles than this ("diksha", "gurukripa") identifies no topic
_WANTS_MANTRA = re.compile(r"(?i)mantra|मंत्र|मन्त्र|sadhana|sadhna|साधना|vidhi|विधि|प्रयोग|jaap|jap\b|जप")

TITLE_MATCHES = 2      # articles added because their title names the topic
BOOK_MATCHES = 2       # book passages added when the question names a book's topic
WIDE_TOP_K = 40        # wider vector search, so a book passage is not crowded out by web chunks


@lru_cache(maxsize=1)
def _generic_skeletons() -> frozenset[str]:
    from collections import Counter

    df = Counter(sk for _, sks, _ in _title_index() for sk in sks)
    return frozenset(sk for sk, n in df.items() if n > GENERIC_TITLE_DF)


def _query_skeletons(question: str) -> set[str]:
    return _skeletons(question) - _STOP_SKELETONS - _generic_skeletons()


def _word_hit(query_sk: str, words: set[str]) -> bool:
    # exact, or a longer word built on it ("सौन्दर्यवती" -> "sndryvt" contains "sndry")
    return any(w == query_sk or (len(query_sk) >= 4 and w.startswith(query_sk)) for w in words)


@lru_cache(maxsize=1)
def _title_index() -> tuple:
    from rag.vector_store import MONGODB_DB_NAME, _get_mongo_client

    coll = _get_mongo_client()[MONGODB_DB_NAME][WEB_ARTICLES]
    return tuple(
        (d["_id"], _skeletons(d["title"]), d.get("mantra_count", 0))
        for d in coll.find({}, {"title": 1, "mantra_count": 1})
    )


def _title_matches(question: str, exclude: set[str], wants_mantra: bool) -> list[dict]:
    """Articles whose title names the question's topic — meaning search alone misses some."""
    query_sks = _query_skeletons(question)
    if not query_sks:
        return []
    scored = []
    for url, title_sks, mantras in _title_index():
        hits = sum(_word_hit(q, title_sks) for q in query_sks)
        if hits and url not in exclude:
            scored.append((hits, mantras > 0 if wants_mantra else 0, mantras, url))
    scored.sort(reverse=True)
    best = [url for *_, url in scored[:TITLE_MATCHES]]
    docs = _full_articles(best)
    return [docs[u] for u in best if u in docs]


@lru_cache(maxsize=1)
def _book_index() -> tuple:
    """(book_slug, book name, name skeletons) for every ingested book."""
    from rag.vector_store import MONGODB_COLLECTION, MONGODB_DB_NAME, _get_mongo_client

    coll = _get_mongo_client()[MONGODB_DB_NAME][MONGODB_COLLECTION]
    rows = coll.aggregate([
        {"$match": {"metadata.source_type": {"$ne": "web"}}},
        {"$group": {"_id": "$metadata.book_slug", "name": {"$first": "$metadata.book"}}},
    ])
    return tuple((r["_id"], r["name"] or "", _skeletons(f"{r['name']} {r['_id']}")) for r in rows if r["_id"])


def _book_matches(question: str, wants_mantra: bool) -> list[Source]:
    """When the question names a book's topic (e.g. "soundarya"), search inside that book directly."""
    query_sks = _query_skeletons(question)
    slugs = [slug for slug, _, name_sks in _book_index() if any(_word_hit(q, name_sks) for q in query_sks)]
    if not slugs:
        return []

    import numpy as np
    from rag.embeddings import get_embedding_model
    from rag.vector_store import MONGODB_COLLECTION, MONGODB_DB_NAME, _get_mongo_client

    coll = _get_mongo_client()[MONGODB_DB_NAME][MONGODB_COLLECTION]
    chunks = list(coll.find({"metadata.book_slug": {"$in": slugs}}, {"embedding": 1, "text": 1, "metadata": 1}))
    if not chunks:
        return []
    query = np.asarray(get_embedding_model().get_query_embedding(question))
    vectors = np.asarray([c["embedding"] for c in chunks])
    scores = vectors @ query / (np.linalg.norm(vectors, axis=1) * np.linalg.norm(query) + 1e-9)
    order = [int(i) for i in np.argsort(-scores)]
    if wants_mantra:
        # Lead with the best passage that actually contains a mantra, not one that only discusses it.
        with_mantra = next((i for i in order if mantra_spans(chunks[i]["text"])), None)
        if with_mantra is not None:
            order = [with_mantra] + [i for i in order if i != with_mantra]

    pages: dict[str, list[dict]] = {}
    for i in order:
        md = chunks[i]["metadata"]
        pages.setdefault(f"{md.get('book_slug')}:{md.get('page')}", []).append(chunks[i])
        if len(pages) > BOOK_MATCHES:
            break
    sources = []
    for key, group in list(pages.items())[:BOOK_MATCHES]:
        md = group[0]["metadata"]
        text = "\n".join(c["text"] for c in group)
        sources.append(Source(md.get("chapter_title") or md.get("book") or "", text, False,
                              md.get("book"), md.get("page"), md.get("topic"), None, text[:300]))
    return sources


def _source_key(s: Source) -> str:
    return s.url or f"{s.book}:{s.page}"


def gather_sources(question: str, top_k: int = 12) -> list[Source]:
    wants_mantra = bool(_WANTS_MANTRA.search(question))
    nodes = _retriever(max(top_k, WIDE_TOP_K)).retrieve(question)

    groups: dict[str, list] = {}  # insertion order = best score first
    for nws in nodes:
        md = nws.node.metadata or {}
        key = md.get("source_url") or f"{md.get('book_slug')}:{md.get('page')}"
        groups.setdefault(key, []).append(nws)

    book_sources = _book_matches(question, wants_mantra)
    title_hits = _title_matches(question, exclude=set(groups) | {_source_key(s) for s in book_sources},
                                wants_mantra=wants_mantra)
    title_sources = [
        Source(d["title"], _window(d["text"], ""), True, d.get("site_name"), None, None, d["_id"], d["text"][:300])
        for d in title_hits
    ]

    # Vector results fill the remaining slots; keep the best book passage among them if there is one.
    ordered = list(groups.items())
    if not book_sources:
        book_groups = [g for g in ordered if (g[1][0].node.metadata or {}).get("source_type") != "web"]
        if book_groups:
            ordered.remove(book_groups[0])
            ordered.insert(0, book_groups[0])
    taken = {_source_key(s) for s in book_sources + title_sources}
    remaining = MAX_SOURCES - len(book_sources) - len(title_sources)
    selected = [(k, g) for k, g in ordered if k not in taken][: max(0, remaining)]

    web_keys = [k for k, g in selected if (g[0].node.metadata or {}).get("source_type") == "web"]
    articles = _full_articles(web_keys)

    vector_sources: list[Source] = []
    for key, group in selected:
        md = group[0].node.metadata or {}
        chunks = [g.node.get_content() for g in group]
        if md.get("source_type") == "web":
            article = articles.get(key)
            text = _window(article["text"], chunks[0]) if article else "\n".join(chunks)
            vector_sources.append(Source(md.get("chapter_title") or "", text, True, md.get("book"), None,
                                         md.get("topic"), key, chunks[0][:300]))
        else:
            vector_sources.append(Source(md.get("chapter_title") or md.get("book") or "", "\n".join(chunks), False,
                                         md.get("book"), md.get("page"), md.get("topic"), None, chunks[0][:300]))
    # The question names the book's or article's topic directly, so those come first.
    return book_sources + title_sources + vector_sources


def _format_sources(sources: list[Source]) -> str:
    parts = []
    for i, s in enumerate(sources, 1):
        kind = "article" if s.is_web else f"book: {s.book}" + (f", page {s.page}" if s.page else "")
        parts.append(f"[SOURCE {i}] ({kind}) Title: {s.title}\n{s.text}\n[END SOURCE {i}]")
    return "\n\n".join(parts) if parts else "(no sources found)"


# ── Mantra verification ─────────────────────────────────────────────────────

# Words that mark a mantra: pranava, common bija syllables and closing words.
_MARKERS = (
    "ॐ", "ओम्", "ह्रीं", "श्रीं", "क्लीं", "ऐं", "क्रीं", "हुं", "हूं", "ग्लौं", "ह्लीं", "स्त्रीं",
    "ह्रौं", "दुं", "गं", "नमः", "स्वाहा", "फट्", "वषट्",
)
_DEV_RUN = re.compile(r"[ऀ-ॿ][ऀ-ॿ\s\-‑–]*[ऀ-ॿ]")
_COLON_AS_VISARGA = re.compile(r"(?<=[ऀ-ॿ]):")  # "नम:" is often typed for "नमः"


def _visarga(text: str) -> str:
    return _COLON_AS_VISARGA.sub("ः", text)


def _norm(text: str) -> str:
    """Devanagari letters and marks only: ignores spacing, dandas, hyphens and ':' vs visarga."""
    text = unicodedata.normalize("NFC", _visarga(text))
    return "".join(ch for ch in text if "ऀ" <= ch <= "ॿ" and ch not in "।॥")


def mantra_spans(answer: str) -> list[str]:
    """Mantra-like spans: from the first to the last marker word inside a Devanagari run."""
    spans = []
    for run in _DEV_RUN.findall(_visarga(answer)):
        words = run.split()
        hits = [i for i, w in enumerate(words) if any(m in w for m in _MARKERS)]
        if len(hits) >= 2 or (hits and len(words) >= 2 and words[hits[0]].startswith("ॐ")):
            span = " ".join(words[hits[0] : hits[-1] + 1] if len(hits) >= 2 else words[hits[0] :])
            if len(_norm(span)) >= 6:
                spans.append(span)
    return spans


def unverified_mantras(answer: str, sources: list[Source]) -> list[str]:
    normalised = [_norm(s.text) for s in sources]
    return [span for span in mantra_spans(answer) if not any(_norm(span) in n for n in normalised)]


def _drop_lines_with(answer: str, spans: list[str]) -> str:
    kept = [ln for ln in answer.splitlines() if not any(_norm(s) in _norm(ln) for s in spans)]
    return "\n".join(kept).strip()


REPAIR_MIN_SIMILARITY = 0.8


def _repair_mantras(answer: str, bad: list[str], sources: list[Source]) -> tuple[str, list[str]]:
    """Swap a near-miss mantra (a garbled syllable, say) for the exact one from the source.

    Returns the repaired answer and the spans that had no close source match.
    """
    from difflib import SequenceMatcher

    source_spans = [sp for s in sources for sp in mantra_spans(s.text)]
    unresolved = []
    for span in bad:
        target = _norm(span)
        best = max(source_spans, key=lambda sp: SequenceMatcher(None, target, _norm(sp)).ratio(), default=None)
        if best and SequenceMatcher(None, target, _norm(best)).ratio() >= REPAIR_MIN_SIMILARITY:
            answer = answer.replace(span, best)
        else:
            unresolved.append(span)
    return answer, unresolved


# ── Entry point ─────────────────────────────────────────────────────────────

_EMPHASIS = re.compile(r"\*{1,2}([^*\n]+?)\*{1,2}")
_MARKDOWN = re.compile(r"\*\*|__|^#{1,6}\s*", re.M)
_BULLET = re.compile(r"^\s*\*\s+", re.M)
# "(Source 4)", "(स्रोत 2, 3)", or a trailing "— Source 1" label: the prompt's numbering must
# not reach the reader. Mid-sentence mentions are left alone (removing them breaks the sentence;
# the prompt forbids them anyway).
_SOURCE_REFS = re.compile(
    r"\s*\((?:source|स्रोत)\s*\d+(?:\s*(?:,|and|&)\s*\d+)*\)|\s*[-–—:]?\s*\b(?:source|स्रोत)\s+\d+\s*$",
    re.I | re.M,
)


_AS_GIVEN = re.compile(r"\s*\(as (?:given|written|stated)(?: in the (?:source|article|text))?\)", re.I)
_RULE_LINE = re.compile(r"^\s*(?:-{3,}|\*{3,}|_{3,})\s*$\n?", re.M)


def _clean(text: str) -> str:
    """The chat renders plain text, and answers should not point at their sources."""
    text = _RULE_LINE.sub("", text)
    text = _EMPHASIS.sub(r"\1", text)
    text = _BULLET.sub("- ", text)
    text = _MARKDOWN.sub("", text)
    text = _AS_GIVEN.sub("", text)
    text = _SOURCE_REFS.sub("", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def _complete(prompt: str, temperature: float) -> str:
    text = _llm().complete(prompt, temperature=temperature, max_tokens=ANSWER_MAX_TOKENS).text.strip()
    if not text:  # reasoning used up the budget — try once more with room to spare
        logger.warning("empty completion, retrying with a larger token budget")
        text = _llm().complete(prompt, temperature=temperature, max_tokens=ANSWER_MAX_TOKENS * 2).text.strip()
    return _clean(text)


def answer_language(question: str) -> str:
    """The model drifts to the (mostly Hindi) sources' language, so decide it here."""
    letters = [c for c in question if c.isalpha()]
    devanagari = sum(1 for c in letters if "ऀ" <= c <= "ॿ")
    if letters and devanagari / len(letters) > 0.3:
        return "Hindi (Devanagari script)"
    return "English — or, if the question is Hindi written in Roman letters, Hinglish in Roman letters"


def _looks_like_questions(answer: str) -> bool:
    """The model sometimes asks its clarifying questions but forgets the marker."""
    asks = sum(1 for line in answer.splitlines() if line.strip().endswith(("?", "？")))
    return asks >= 2 and not mantra_spans(answer)


PENDING_NOTE = """
THE USER IS ANSWERING YOUR CLARIFYING QUESTIONS about this earlier request: "{request}"
Now give the personalised answer for their situation. Do not ask again.
"""


def _names_a_topic(text: str) -> bool:
    """Does the message name something we have articles or a book about (a deity, a sadhana …)?"""
    query_sks = _query_skeletons(text)
    if not query_sks:
        return False
    if any(_word_hit(q, sks) for _, sks, _ in _title_index() for q in query_sks):
        return True
    return any(_word_hit(q, sks) for _, _, sks in _book_index() for q in query_sks)


def answer_question(
    question: str,
    history: str = "",
    top_k: int = 12,
    pending_request: str | None = None,
    previous_questions: list[str] | None = None,
) -> tuple[str, list[Source], bool]:
    """Returns (answer, sources, asked). `asked` is True when the reply is a clarifying question.

    `previous_questions` are the session's earlier user messages, oldest first.
    """
    # A reply like "for my wife, I'm a beginner" only makes sense together with the original request;
    # likewise a follow-up that names no topic of its own ("how many days?") continues the most
    # recent earlier question that did name one.
    context = pending_request
    if not context and previous_questions and not _names_a_topic(question):
        context = next((q for q in reversed(previous_questions) if _names_a_topic(q)), None)
    search_text = f"{context}\n{question}" if context else question
    sources = gather_sources(search_text, top_k)
    prompt = PROMPT.format(
        ask_marker=ASK_MARKER,
        history=history or "(none)",
        sources=_format_sources(sources),
        pending=PENDING_NOTE.format(request=pending_request) if pending_request else "",
        question=question,
        language=answer_language(question),
    )

    answer = _complete(prompt, ANSWER_TEMPERATURE)
    if ASK_MARKER in answer or _looks_like_questions(answer):
        answer = answer.replace(ASK_MARKER, "").strip()
        # Ask at most once per request: after the user has answered, never loop back to questions.
        if not pending_request:
            return answer, [], True

    bad = unverified_mantras(answer, sources)
    if bad:
        logger.warning("answer contained unverified mantras, retrying: %s", bad)
        retry = prompt + RETRY_NOTE.format(bad="\n".join(f"- {b}" for b in bad))
        answer = _complete(retry, 0.0)
        bad = unverified_mantras(answer, sources)
        if bad:
            answer, unresolved = _repair_mantras(answer, bad, sources)
            if len(unresolved) < len(bad):
                logger.warning("restored %d mantra(s) verbatim from source", len(bad) - len(unresolved))
            if unresolved:
                logger.warning("removing mantra lines with no source match: %s", unresolved)
                answer = _drop_lines_with(answer, unresolved)
    return answer.replace(ASK_MARKER, "").strip(), sources, False
