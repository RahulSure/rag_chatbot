"""
Query router — RAG Q&A endpoints with session memory and filtered retrieval.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from packages.shared.schemas import (
    QueryRequest,
    QueryResponse,
    FilteredQueryRequest,
    SourceNode,
)
from apps.api.deps import get_redis_optional, get_db

router = APIRouter(prefix="/query", tags=["RAG"])

SESSION_TTL = 3600  # 1 hour
MAX_HISTORY = 10


def _get_session_history(session_id: str | None) -> str:
    if not session_id:
        return ""
    r = get_redis_optional()
    if not r:
        return ""
    raw = r.get(f"session:{session_id}")
    if not raw:
        return ""
    history = json.loads(raw)
    lines = []
    for turn in history[-MAX_HISTORY:]:
        lines.append(f"User: {turn['q']}")
        lines.append(f"Assistant: {turn['a'][:200]}...")
    return "\n".join(lines)


def _save_session_turn(session_id: str, question: str, answer: str):
    r = get_redis_optional()
    if not r:
        return
    key = f"session:{session_id}"
    raw = r.get(key) or "[]"
    history = json.loads(raw)
    history.append({"q": question, "a": answer, "ts": datetime.utcnow().isoformat()})
    history = history[-MAX_HISTORY:]
    r.setex(key, SESSION_TTL, json.dumps(history, ensure_ascii=False))


def _log_query(question: str, session_id: str | None, language: str = "auto"):
    try:
        db = get_db()
        db["query_logs"].insert_one({
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


def _source_nodes_to_schema(source_nodes) -> list[SourceNode]:
    result: list[SourceNode] = []
    for node in source_nodes:
        metadata = getattr(node, "metadata", {}) or {}
        text = getattr(node, "text", "") or getattr(node.node, "text", "")
        snippet = text[:300].strip() + ("..." if len(text) > 300 else "")
        result.append(
            SourceNode(
                page=metadata.get("page"),
                book=metadata.get("book"),
                chapter=metadata.get("chapter_title"),
                topic=metadata.get("topic"),
                text_snippet=snippet,
            )
        )
    return result


@router.post("", response_model=QueryResponse)
def query(req: QueryRequest):
    """Ask a question — sync or streaming. Supports session memory."""
    session_id = req.session_id or str(uuid.uuid4())

    if req.stream:
        return _handle_streaming(req, session_id)

    return _handle_sync(req, session_id)


@router.post("/filtered", response_model=QueryResponse)
def filtered_query(req: FilteredQueryRequest):
    """Query with optional filters: book, topic, language."""
    session_id = req.session_id or str(uuid.uuid4())
    return _handle_filtered(req, session_id)


def _handle_sync(req: QueryRequest, session_id: str) -> QueryResponse:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service"))

    from rag.query_engine import get_query_engine

    history = _get_session_history(session_id)

    try:
        engine = get_query_engine(similarity_top_k=req.top_k)
        question_with_history = f"{history}\n\nUser: {req.question}" if history else req.question
        response = engine.query(question_with_history)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    answer = str(response)
    _save_session_turn(session_id, req.question, answer)
    _log_query(req.question, session_id)

    return QueryResponse(
        answer=answer,
        sources=_source_nodes_to_schema(response.source_nodes),
        model=os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
        session_id=session_id,
    )


def _handle_filtered(req: FilteredQueryRequest, session_id: str) -> QueryResponse:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service"))

    from rag.query_engine import get_query_engine

    try:
        engine = get_query_engine(
            similarity_top_k=req.top_k,
            book_slug=req.book_slug,
            topic=req.topic,
            language=req.language,
        )
        response = engine.query(req.question)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    answer = str(response)
    _save_session_turn(session_id, req.question, answer)
    _log_query(req.question, session_id, req.language or "auto")

    return QueryResponse(
        answer=answer,
        sources=_source_nodes_to_schema(response.source_nodes),
        model=os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
        session_id=session_id,
    )


def _handle_streaming(req: QueryRequest, session_id: str) -> StreamingResponse:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service"))

    from rag.query_engine import get_streaming_query_engine

    history = _get_session_history(session_id)

    def token_generator():
        accumulated = ""
        try:
            engine = get_streaming_query_engine(similarity_top_k=req.top_k)
            question = f"{history}\n\nUser: {req.question}" if history else req.question
            streaming_response = engine.query(question)
            for token in streaming_response.response_gen:
                accumulated += token
                yield f"data: {json.dumps(token)}\n\n"
            yield f"data: [SESSION:{session_id}]\n\n"
            yield "data: [DONE]\n\n"
            _save_session_turn(session_id, req.question, accumulated)
            _log_query(req.question, session_id)
        except Exception as exc:
            yield f"data: [ERROR] {str(exc)}\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
