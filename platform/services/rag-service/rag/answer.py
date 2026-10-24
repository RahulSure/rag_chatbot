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

MAX_SOURCES = 4          # distinct articles / book passages handed to the model
ARTICLE_CHARS = 7000     # per web article; longer ones are windowed around the match
WEB_ARTICLES = "web_articles"
ANSWER_TEMPERATURE = 0.2
# gpt-oss is a reasoning model: hidden reasoning tokens count against max_tokens,
# so multi-procedure answers need far more than the wrapper's default of 1024.
ANSWER_MAX_TOKENS = 4096

PROMPT = """You are a warm, well-read assistant who explains the spiritual teachings of Dr. Narayan Dutt Shrimali (Paramhans Swami Nikhileshwaranand) — from his books and from articles by his disciples.

Below are SOURCES. Each one is a separate book passage or a complete article.

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
- If no source is relevant at all, answer briefly from general knowledge of the tradition, without claiming it comes from the books.
- If the topic involves tantra, sadhana or attraction practices, end with ONE sentence that such practices should be done under a qualified guru's guidance.
- For vashikaran, mohan, uchchatan, maran or similar influence rituals, and for parad (mercury) sadhana or alchemy, add ONE short warning line that these must be done only under a qualified, experienced guru. Never give steps for heating, processing or consuming mercury — it is highly toxic; explain the significance instead.

CONVERSATION SO FAR:
{history}

SOURCES:
{sources}

USER'S QUESTION: {question}

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


def gather_sources(question: str, top_k: int = 12) -> list[Source]:
    nodes = _retriever(top_k).retrieve(question)

    groups: dict[str, list] = {}  # insertion order = best score first
    for nws in nodes:
        md = nws.node.metadata or {}
        key = md.get("source_url") or f"{md.get('book_slug')}:{md.get('page')}"
        groups.setdefault(key, []).append(nws)
    selected = list(groups.items())[:MAX_SOURCES]

    web_keys = [k for k, g in selected if (g[0].node.metadata or {}).get("source_type") == "web"]
    articles = _full_articles(web_keys)

    sources: list[Source] = []
    for key, group in selected:
        md = group[0].node.metadata or {}
        chunks = [g.node.get_content() for g in group]
        if md.get("source_type") == "web":
            article = articles.get(key)
            text = _window(article["text"], chunks[0]) if article else "\n".join(chunks)
            sources.append(Source(md.get("chapter_title") or "", text, True, md.get("book"), None, md.get("topic"), key, chunks[0][:300]))
        else:
            sources.append(Source(md.get("chapter_title") or md.get("book") or "", "\n".join(chunks), False,
                                  md.get("book"), md.get("page"), md.get("topic"), None, chunks[0][:300]))
    return sources


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

_MARKDOWN = re.compile(r"\*\*|__|^#{1,6}\s*", re.M)


def _complete(prompt: str, temperature: float) -> str:
    text = _llm().complete(prompt, temperature=temperature, max_tokens=ANSWER_MAX_TOKENS).text.strip()
    if not text:  # reasoning used up the budget — try once more with room to spare
        logger.warning("empty completion, retrying with a larger token budget")
        text = _llm().complete(prompt, temperature=temperature, max_tokens=ANSWER_MAX_TOKENS * 2).text.strip()
    return _MARKDOWN.sub("", text)  # the chat renders plain text


def answer_question(question: str, history: str = "", top_k: int = 12) -> tuple[str, list[Source]]:
    sources = gather_sources(question, top_k)
    prompt = PROMPT.format(history=history or "(none)", sources=_format_sources(sources), question=question)

    answer = _complete(prompt, ANSWER_TEMPERATURE)
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
    return answer, sources
