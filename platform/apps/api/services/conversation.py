"""
Conversational session state (v2) for the RAG chatbot.

Stored in Redis under `session:{session_id}` with a sliding TTL. Tracks, per
turn, the raw question, the resolved standalone question, a truncated answer,
and which book(s) the turn was routed to — plus the session's active books and
an optional manual book pin. Degrades gracefully when Redis is absent (every
load returns an empty session; saves are no-ops).

Replaces the old flat-text `_get_session_history` / `_save_session_turn`.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from datetime import datetime

from apps.api.deps import get_redis_optional

SESSION_TTL = 3600          # sliding, seconds
MAX_TURNS = 10
ANSWER_STORE_CAP = 600      # chars kept per stored answer
ANSWER_RENDER_CAP = 300     # chars shown to the router per answer
JSON_MAX_BYTES = 16384


@dataclass
class Turn:
    q: str                  # raw user question
    sq: str                 # resolved standalone question
    a: str                  # answer (truncated)
    books: list[str] = field(default_factory=list)
    ts: str = ""


@dataclass
class SessionState:
    turns: list[Turn] = field(default_factory=list)
    active_books: list[str] = field(default_factory=list)
    pinned_book: str | None = None

    @property
    def has_history(self) -> bool:
        return len(self.turns) > 0


def _key(session_id: str) -> str:
    return f"session:{session_id}"


def load_session(session_id: str | None) -> SessionState:
    """Load session state; empty state if no id / no Redis / unknown id."""
    if not session_id:
        return SessionState()
    r = get_redis_optional()
    if not r:
        return SessionState()
    raw = r.get(_key(session_id))
    if not raw:
        return SessionState()

    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return SessionState()

    # v1 migration: the old format was a bare list of {q, a, ts} turns.
    if isinstance(data, list):
        turns = [Turn(q=t.get("q", ""), sq=t.get("q", ""), a=t.get("a", ""),
                      books=[], ts=t.get("ts", "")) for t in data]
        return SessionState(turns=turns[-MAX_TURNS:])

    turns = [
        Turn(q=t.get("q", ""), sq=t.get("sq", t.get("q", "")), a=t.get("a", ""),
             books=t.get("books", []) or [], ts=t.get("ts", ""))
        for t in data.get("turns", [])
    ]
    return SessionState(
        turns=turns[-MAX_TURNS:],
        active_books=data.get("active_books", []) or [],
        pinned_book=data.get("pinned_book"),
    )


def _persist(session_id: str, state: SessionState) -> None:
    r = get_redis_optional()
    if not r:
        return
    payload = {
        "v": 2,
        "pinned_book": state.pinned_book,
        "active_books": state.active_books,
        "turns": [asdict(t) for t in state.turns[-MAX_TURNS:]],
    }
    blob = json.dumps(payload, ensure_ascii=False)
    # Drop oldest turns until under the size cap.
    while len(blob.encode("utf-8")) > JSON_MAX_BYTES and payload["turns"]:
        payload["turns"].pop(0)
        blob = json.dumps(payload, ensure_ascii=False)
    r.setex(_key(session_id), SESSION_TTL, blob)


def save_turn(
    session_id: str,
    question: str,
    standalone: str,
    answer: str,
    books: list[str],
) -> None:
    """Append a turn and refresh the sliding TTL. No-op without Redis."""
    if not session_id:
        return
    state = load_session(session_id)
    state.turns.append(Turn(
        q=question,
        sq=standalone or question,
        a=(answer or "")[:ANSWER_STORE_CAP],
        books=books or [],
        ts=datetime.utcnow().isoformat(),
    ))
    state.turns = state.turns[-MAX_TURNS:]
    # active_books = most recent turn's books (if it was book-scoped)
    if books:
        state.active_books = books
    _persist(session_id, state)


def set_pin(session_id: str, book_slug: str | None) -> None:
    """Set (or clear, if None) the manual book pin for a session."""
    if not session_id:
        return
    state = load_session(session_id)
    state.pinned_book = book_slug
    _persist(session_id, state)


def render_history_for_router(state: SessionState) -> str:
    """Compact history block for the condense+route prompt."""
    lines = []
    for t in state.turns:
        tag = f"  [books: {', '.join(t.books)}]" if t.books else ""
        lines.append(f"User: {t.sq or t.q}{tag}")
        if t.a:
            lines.append(f"Assistant: {t.a[:ANSWER_RENDER_CAP]}")
    return "\n".join(lines)
