"""
Query router — book-aware conversational RAG.

Each turn: load session -> route (pin > heuristic > condense+route LLM > fallback)
-> retrieve book-scoped -> synthesize -> save turn. History is used only to
resolve the standalone question; the resolved question (not flat history text)
drives retrieval, so book switches and follow-ups stay in the right book.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from packages.shared.schemas import (
    QueryRequest,
    QueryResponse,
    FilteredQueryRequest,
    SourceNode,
)
from apps.api.deps import get_db, get_redis_optional
from apps.api.services.conversation import (
    load_session,
    save_turn,
    set_pin,
    render_history_for_router,
    SessionState,
)

router = APIRouter(prefix="/query", tags=["RAG"])

MODEL = os.getenv("KRUTRIM_MODEL", "gpt-oss-120b")


# ──────────────────────────────────────────────────────────────────────────────
# Logging / helpers
# ──────────────────────────────────────────────────────────────────────────────

def _log_query(question: str, session_id: str | None, language: str = "auto"):
    try:
        get_db()["query_logs"].insert_one({
            "query": question,
            "session_id": session_id,
            "language": language,
            "timestamp": datetime.utcnow(),
        })
        r = get_redis_optional()
        if r:
            r.zincrby("trending_queries", 1, question.lower().strip())
    except Exception:
        pass
    try:
        from apps.api.middleware import QUERY_COUNT
        if QUERY_COUNT is not None:
            QUERY_COUNT.labels(language).inc()
    except Exception:
        pass


def _source_nodes_to_schema(source_nodes) -> list[SourceNode]:
    result: list[SourceNode] = []
    for node in source_nodes:
        metadata = getattr(node, "metadata", {}) or {}
        text = getattr(node, "text", "") or getattr(node.node, "text", "")
        snippet = text[:300].strip() + ("..." if len(text) > 300 else "")
        result.append(SourceNode(
            page=metadata.get("page"),
            book=metadata.get("book"),
            chapter=metadata.get("chapter_title"),
            topic=metadata.get("topic"),
            text_snippet=snippet,
        ))
    return result


def _decide_route(question: str, state: SessionState, pin: str | None):
    """Pin > heuristic (turn 1) > condense+route LLM > deterministic fallback."""
    from rag.router import (
        get_book_registry,
        heuristic_route,
        route_and_condense,
        fallback_route,
        RouteResult,
    )
    from rag.query_engine import get_llm

    registry = get_book_registry()
    effective_pin = pin or state.pinned_book
    history_block = render_history_for_router(state)

    if effective_pin:
        # Pin wins for filtering; still resolve pronouns if there is history.
        if state.has_history:
            try:
                rr = route_and_condense(question, history_block, registry, get_llm())
            except Exception as e:
                rr = RouteResult(question, [], fallback_reason=str(e))
            rr.book_slugs = [effective_pin]
            return rr
        return RouteResult(question, [effective_pin])

    if not state.has_history:
        hits = heuristic_route(question, registry)
        if hits:
            return RouteResult(question, hits)
        # No history and no roman-script alias hit: one LLM route attempt catches
        # Devanagari book names; on failure fall back to unfiltered.
        try:
            return route_and_condense(question, "", registry, get_llm())
        except Exception as e:
            return fallback_route(question, state.active_books, registry, reason=str(e))

    try:
        return route_and_condense(question, history_block, registry, get_llm())
    except Exception as e:
        return fallback_route(question, state.active_books, registry, reason=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post("", response_model=QueryResponse)
def query(req: QueryRequest):
    """Ask a question — sync or streaming, with book-aware session memory."""
    session_id = req.session_id or str(uuid.uuid4())
    if req.book_slug:
        set_pin(session_id, req.book_slug)
    if req.stream:
        return _handle_streaming(req.question, session_id, req.top_k, pin=req.book_slug)
    return _handle_sync(req.question, session_id, req.top_k, pin=req.book_slug)


@router.post("/filtered", response_model=QueryResponse)
def filtered_query(req: FilteredQueryRequest):
    """Query with a manual book pin (book_slug) and optional topic/language.

    Setting book_slug pins the session to that book for subsequent /query calls;
    book_slug=null clears the pin.
    """
    session_id = req.session_id or str(uuid.uuid4())
    set_pin(session_id, req.book_slug)

    state = load_session(session_id)
    # Condense against history (resolve pronouns); the pin dictates the book.
    from rag.router import route_and_condense, get_book_registry, RouteResult
    from rag.query_engine import get_llm, answer_query

    standalone = req.question
    if state.has_history:
        try:
            rr = route_and_condense(req.question, render_history_for_router(state),
                                    get_book_registry(), get_llm())
            standalone = rr.standalone_question
        except Exception:
            standalone = req.question

    book_slugs = [req.book_slug] if req.book_slug else None
    try:
        response = answer_query(
            standalone, book_slugs=book_slugs, top_k=req.top_k,
            topic=req.topic, language=req.language, streaming=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM/retrieval error: {exc}")

    answer = str(response)
    used_books = book_slugs or []
    save_turn(session_id, req.question, standalone, answer, used_books)
    _log_query(req.question, session_id, req.language or "auto")

    return QueryResponse(
        answer=answer,
        sources=_source_nodes_to_schema(response.source_nodes),
        model=MODEL,
        session_id=session_id,
        routed_books=used_books or None,
        standalone_question=standalone if standalone != req.question else None,
    )


def _handle_sync(question: str, session_id: str, top_k: int, pin: str | None) -> QueryResponse:
    from rag.query_engine import answer_query

    state = load_session(session_id)
    route = _decide_route(question, state, pin)

    try:
        response = answer_query(
            route.standalone_question,
            book_slugs=route.book_slugs or None,
            top_k=top_k,
            streaming=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM/retrieval error: {exc}")

    answer = str(response)
    save_turn(session_id, question, route.standalone_question, answer, route.book_slugs)
    _log_query(question, session_id)

    return QueryResponse(
        answer=answer,
        sources=_source_nodes_to_schema(response.source_nodes),
        model=MODEL,
        session_id=session_id,
        routed_books=route.book_slugs or None,
        standalone_question=(
            route.standalone_question if route.standalone_question != question else None
        ),
    )


def _handle_streaming(question: str, session_id: str, top_k: int, pin: str | None) -> StreamingResponse:
    from rag.query_engine import answer_query

    state = load_session(session_id)
    # Routing (may call the LLM) happens up front, before the SSE stream starts.
    try:
        route = _decide_route(question, state, pin)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Routing error: {exc}")

    def token_generator():
        meta = {"books": route.book_slugs, "standalone": route.standalone_question}
        yield f"data: [META:{json.dumps(meta, ensure_ascii=False)}]\n\n"

        accumulated = ""
        try:
            response = answer_query(
                route.standalone_question,
                book_slugs=route.book_slugs or None,
                top_k=top_k,
                streaming=True,
            )
            for token in response.response_gen:
                accumulated += token
                yield f"data: {json.dumps(token)}\n\n"
            yield f"data: [SESSION:{session_id}]\n\n"
            yield "data: [DONE]\n\n"
            save_turn(session_id, question, route.standalone_question, accumulated, route.book_slugs)
            _log_query(question, session_id)
        except Exception as exc:
            yield f"data: [ERROR] {str(exc)}\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
