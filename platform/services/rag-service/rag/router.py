"""
Book-aware routing + query condensation for the conversational RAG chatbot.

Given a user question and the prior conversation, decide which book(s) the
question concerns and rewrite it into a self-contained standalone question
(resolving pronouns / references). This drives book_slug metadata filters on
retrieval so the bot can switch books mid-conversation and carry context.

Two paths:
  - heuristic_route(): zero-latency alias matching from the dynamic BookRegistry
    (used on the first turn when the user names a book in roman script).
  - route_and_condense(): one Krutrim LLM call (condense + route) used whenever
    there is conversation history (coreference must be resolved).

fallback_route() is a deterministic safety net when the LLM call fails.
The BookRegistry is built from MongoDB (no hardcoded book list) and cached with
a TTL so admin-uploaded books are picked up automatically.
"""

from __future__ import annotations

import json
import re
import time
import unicodedata
from dataclasses import dataclass, field

# Anaphors that suggest a follow-up referencing the previous turn's book.
_ANAPHORS = {
    "uska", "uske", "usko", "usme", "usmein", "us", "iska", "iske", "isko",
    "isme", "ismein", "is", "vo", "wo", "ye", "yeh", "iski", "uski",
    "इसका", "इसके", "इसकी", "इसमें", "उसका", "उसके", "उसकी", "उसमें",
    "यह", "वह", "इस", "उस", "इसे", "उसे", "its", "it", "that", "this", "them",
}

_REGISTRY_TTL_SECONDS = 600
_registry_cache: tuple[list["BookInfo"], float] | None = None


@dataclass
class BookInfo:
    slug: str
    name: str
    language: str = "hi"
    aliases: set[str] = field(default_factory=set)
    topics: list[str] = field(default_factory=list)
    chapter_titles: list[str] = field(default_factory=list)


@dataclass
class RouteResult:
    standalone_question: str
    book_slugs: list[str]           # [] means search all books (no filter)
    carry_context: bool = False
    used_llm: bool = False
    fallback_reason: str | None = None


# ──────────────────────────────────────────────────────────────────────────────
# Book registry (dynamic, TTL-cached)
# ──────────────────────────────────────────────────────────────────────────────

def _norm(text: str) -> str:
    """Lowercase + strip diacritics for case/accent-insensitive matching."""
    text = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in text if not unicodedata.combining(c))


def _tokenize(text: str) -> list[str]:
    return [t for t in re.split(r"[\s\-_/]+", _norm(text)) if t]


def _build_registry() -> list[BookInfo]:
    from rag.vector_store import get_collection

    coll = get_collection()
    pipeline = [
        {"$group": {
            "_id": "$metadata.book_slug",
            "name": {"$first": "$metadata.book"},
            "language": {"$first": "$metadata.language"},
            "tags": {"$addToSet": "$metadata.tags"},
            "topics": {"$addToSet": "$metadata.topic"},
            "chapters": {"$addToSet": "$metadata.chapter_title"},
            "book_aliases": {"$addToSet": "$metadata.book_aliases"},
        }},
        {"$match": {"_id": {"$ne": None}}},
    ]

    books: list[BookInfo] = []
    for r in coll.aggregate(pipeline):
        slug = r["_id"]
        name = r.get("name") or slug
        aliases: set[str] = set()
        aliases.update(_tokenize(slug))
        aliases.update(_tokenize(name))
        # tags / book_aliases are arrays-of-arrays from $addToSet; flatten.
        for group in (r.get("tags") or []):
            for tag in (group or []):
                if tag:
                    aliases.update(_tokenize(str(tag)))
        for group in (r.get("book_aliases") or []):
            for alias in (group or []):
                if alias:
                    aliases.update(_tokenize(str(alias)))
        topics = [t for t in (r.get("topics") or []) if t]
        chapters = [c for c in (r.get("chapters") or []) if c]
        books.append(BookInfo(
            slug=slug,
            name=name,
            language=r.get("language") or "hi",
            aliases=aliases,
            topics=topics,
            chapter_titles=chapters,
        ))
    return books


def get_book_registry(force: bool = False) -> list[BookInfo]:
    global _registry_cache
    now = time.time()
    if not force and _registry_cache and (now - _registry_cache[1]) < _REGISTRY_TTL_SECONDS:
        return _registry_cache[0]
    try:
        books = _build_registry()
        _registry_cache = (books, now)
        return books
    except Exception:
        # Serve stale registry if we have one; otherwise empty (route unfiltered).
        if _registry_cache:
            return _registry_cache[0]
        return []


def invalidate_registry() -> None:
    global _registry_cache
    _registry_cache = None


def _discriminative_aliases(registry: list[BookInfo]) -> dict[str, set[str]]:
    """Aliases that belong to exactly one book (drop shared tokens like 'sadhana')."""
    counts: dict[str, int] = {}
    for b in registry:
        for a in b.aliases:
            counts[a] = counts.get(a, 0) + 1
    return {b.slug: {a for a in b.aliases if counts.get(a, 0) == 1} for b in registry}


# ──────────────────────────────────────────────────────────────────────────────
# Heuristic routing (zero LLM cost)
# ──────────────────────────────────────────────────────────────────────────────

def heuristic_route(question: str, registry: list[BookInfo]) -> list[str]:
    """Return book slugs whose discriminative aliases appear in the question.

    Empty list = no confident match.
    """
    if not registry:
        return []
    disc = _discriminative_aliases(registry)
    q_tokens = set(_tokenize(question))
    hits = [b.slug for b in registry if disc.get(b.slug, set()) & q_tokens]
    return hits


def looks_like_followup(question: str) -> bool:
    q_tokens = set(_tokenize(question))
    if q_tokens & {_norm(a) for a in _ANAPHORS}:
        return True
    return len(q_tokens) <= 4


# ──────────────────────────────────────────────────────────────────────────────
# LLM condense + route
# ──────────────────────────────────────────────────────────────────────────────

_ROUTER_PROMPT = """You are a query analyst for a Hindi spiritual-books Q&A system. Users write in Hindi, Hinglish, or English.

AVAILABLE BOOKS:
{book_registry_block}

CONVERSATION SO FAR (most recent last):
{history_block}

NEW USER MESSAGE: {question}

Your tasks:
1. REWRITE the new message as ONE self-contained standalone question in the SAME language/script the user used. Resolve pronouns and references (uska/iska/vo/isme/यह/वह/its/that) using the conversation. If the message is already self-contained and unrelated to the conversation, return it UNCHANGED and set carry_context to false. Never answer the question. Never translate it.
2. ROUTE: decide which book slug(s) from AVAILABLE BOOKS the standalone question concerns.
   - Follow-up on the same subject -> same book(s) as the referenced turn.
   - Explicit new book mention -> that book, even mid-conversation.
   - Comparison / spans several books -> list every relevant slug.
   - Truly generic (greeting, or a topic matching no book) -> empty list [].

Reply with ONLY this JSON, no other text:
{{"standalone_question": "...", "book_slugs": ["..."], "carry_context": true, "reason": "<=8 words"}}
"""


def _registry_block(registry: list[BookInfo]) -> str:
    lines = []
    for b in registry:
        topics = ", ".join(b.topics[:8])
        chapters = " | ".join(b.chapter_titles[:6])
        lines.append(f"- slug: {b.slug} | name: {b.name} | topics: {topics} | chapters: {chapters}")
    return "\n".join(lines)


def _extract_json(text: str) -> dict | None:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def route_and_condense(
    question: str,
    history_block: str,
    registry: list[BookInfo],
    llm,
    timeout: int = 10,
) -> RouteResult:
    """One LLM call: rewrite to standalone question + route to book slug(s).

    Raises whatever the LLM raises (e.g. KrutrimLLMError) on hard failure; the
    caller falls back deterministically.
    """
    prompt = _ROUTER_PROMPT.format(
        book_registry_block=_registry_block(registry),
        history_block=history_block or "(no prior conversation)",
        question=question,
    )
    resp = llm.complete(prompt, temperature=0.0, max_tokens=300, timeout=timeout)
    data = _extract_json(str(resp))
    if not data:
        raise ValueError("router: could not parse JSON from LLM response")

    known = {b.slug for b in registry}
    slugs = [s for s in (data.get("book_slugs") or []) if s in known]
    standalone = (data.get("standalone_question") or "").strip() or question

    return RouteResult(
        standalone_question=standalone,
        book_slugs=slugs,
        carry_context=bool(data.get("carry_context", False)),
        used_llm=True,
    )


def fallback_route(
    question: str,
    active_books: list[str],
    registry: list[BookInfo],
    reason: str = "llm_failed",
) -> RouteResult:
    """Deterministic routing when the LLM call fails / times out / returns garbage.

    Never worse than the pre-feature behavior (unfiltered).
    """
    hits = heuristic_route(question, registry)
    if hits:
        return RouteResult(question, hits, used_llm=False, fallback_reason=reason)
    if active_books and looks_like_followup(question):
        return RouteResult(question, list(active_books), carry_context=True,
                           used_llm=False, fallback_reason=reason)
    return RouteResult(question, [], used_llm=False, fallback_reason=reason)
