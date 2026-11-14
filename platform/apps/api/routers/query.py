"""
Query router — RAG Q&A endpoints with session memory and filtered retrieval.
"""

from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime
from typing import AsyncGenerator

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from packages.shared.schemas import (
    QueryRequest,
    QueryResponse,
    FilteredQueryRequest,
    SourceNode,
)
from apps.api.auth import get_current_user_optional
from apps.api.deps import get_redis_optional, get_db
from apps.api.middleware import query_rate_limiter

router = APIRouter(prefix="/query", tags=["RAG"])

SESSION_TTL = 3600  # 1 hour
MAX_HISTORY = 10


HISTORY_ANSWER_CHARS = 600  # enough for the companion to remember what it suggested

# Used when Redis is unavailable (local dev): per-process, so not shared across workers.
_LOCAL_SESSIONS: dict[str, tuple[float, list[dict]]] = {}


# ──────────────────────────────────────────────────────────────────────────────
# Session memory
#   Anonymous visitors: Redis (or the in-process fallback), kept for 1 hour.
#   Signed-in users:    a MongoDB `conversations` document that never expires and
#                       stores sources + follow-ups so the chat can be reopened later.
#                       The session_id they send is that conversation's id.
# ──────────────────────────────────────────────────────────────────────────────

def _resolve_session(session_id: str | None, user: dict | None) -> str:
    """The session id to use. For a signed-in user, an unknown or foreign id starts a new conversation."""
    if user is None:
        return session_id or str(uuid.uuid4())
    if session_id:
        try:
            oid = ObjectId(session_id)
            if get_db()["conversations"].count_documents({"_id": oid, "user_id": user["_id"]}, limit=1):
                return session_id
        except Exception:
            pass
    return str(ObjectId())


def _load_turns(session_id: str | None, user: dict | None = None) -> list[dict]:
    """The most recent turns (at most MAX_HISTORY), oldest first."""
    if not session_id:
        return []
    if user is not None:
        try:
            doc = get_db()["conversations"].find_one(
                {"_id": ObjectId(session_id), "user_id": user["_id"]},
                {"turns": {"$slice": -MAX_HISTORY}},
            )
        except Exception:
            return []
        return (doc or {}).get("turns", [])
    r = get_redis_optional()
    if r:
        raw = r.get(f"session:{session_id}")
        return json.loads(raw) if raw else []
    saved_at, turns = _LOCAL_SESSIONS.get(session_id, (0.0, []))
    return turns if time.time() - saved_at < SESSION_TTL else []


def _store_turns(session_id: str, turns: list[dict]) -> None:
    turns = turns[-MAX_HISTORY:]
    r = get_redis_optional()
    if r:
        r.setex(f"session:{session_id}", SESSION_TTL, json.dumps(turns, ensure_ascii=False))
        return
    now = time.time()
    _LOCAL_SESSIONS[session_id] = (now, turns)
    if len(_LOCAL_SESSIONS) > 5000:  # drop expired sessions so memory stays bounded
        for sid in [s for s, (t, _) in _LOCAL_SESSIONS.items() if now - t >= SESSION_TTL]:
            del _LOCAL_SESSIONS[sid]


def _history_text(turns: list[dict]) -> str:
    lines = []
    for turn in turns[-MAX_HISTORY:]:
        answer = turn["a"]
        lines.append(f"User: {turn['q']}")
        lines.append(f"Assistant: {answer[:HISTORY_ANSWER_CHARS]}{'...' if len(answer) > HISTORY_ANSWER_CHARS else ''}")
    return "\n".join(lines)


def _pending_from(turns: list[dict]) -> str | None:
    """The user's earlier request, if the companion's last reply was a clarifying question."""
    if turns and turns[-1].get("clarify"):
        return turns[-1].get("request") or turns[-1]["q"]
    return None


def _save_session_turn(
    session_id: str,
    question: str,
    answer: str,
    *,
    user: dict | None = None,
    turns: list[dict] | None = None,
    clarify: bool = False,
    request: str | None = None,
    sources: list[SourceNode] | None = None,
    suggested: list[str] | None = None,
):
    """Append one turn. `turns` are the already-loaded turns (anonymous path), to avoid re-reading them."""
    now = datetime.utcnow()
    turn: dict = {"q": question, "a": answer}
    if clarify:
        turn.update(clarify=True, request=request or question)

    if user is not None:
        turn.update(
            ts=now,
            sources=[s.model_dump() for s in (sources or [])],
            suggested=suggested or [],
        )
        try:
            get_db()["conversations"].update_one(
                {"_id": ObjectId(session_id), "user_id": user["_id"]},
                {
                    "$push": {"turns": turn},
                    "$set": {"updated_at": now},
                    "$setOnInsert": {"title": question.strip()[:80], "created_at": now},
                },
                upsert=True,
            )
        except Exception:
            pass  # the answer is still returned; only the saved copy is lost
        return

    turn["ts"] = now.isoformat()
    base = turns if turns is not None else _load_turns(session_id)
    _store_turns(session_id, [*base, turn])


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
                url=metadata.get("source_url"),
            )
        )
    return result


@router.post("", response_model=QueryResponse, dependencies=[Depends(query_rate_limiter)])
def query(req: QueryRequest, user: dict | None = Depends(get_current_user_optional)):
    """Ask a question — sync or streaming. Supports session memory; signed-in users'
    chats are saved. Rate limited per IP (anonymous) or per user (signed in)."""
    session_id = _resolve_session(req.session_id, user)

    if req.stream:
        return _handle_streaming(req, session_id, user)

    return _handle_sync(req, session_id, user)


@router.post("/filtered", response_model=QueryResponse, dependencies=[Depends(query_rate_limiter)])
def filtered_query(req: FilteredQueryRequest, user: dict | None = Depends(get_current_user_optional)):
    """Query with optional filters: book, topic, language.
    Rate limited per IP (anonymous) or per user (signed in)."""
    session_id = _resolve_session(req.session_id, user)
    return _handle_filtered(req, session_id, user)


def _generate_follow_ups(question: str, answer: str) -> list[str]:
    """Ask the LLM for 3 follow-up questions based on the answer."""
    try:
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service"))
        from llm.krutrim_llm import OurLLM

        llm = OurLLM(
            api_key=os.getenv("KRUTRIM_API_KEY", ""),
            model_name=os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
        )
        prompt = (
            f"A seeker asked: \"{question}\"\n"
            f"The answer given was: \"{answer[:500]}\"\n\n"
            "Generate exactly 3 short, curiosity-sparking follow-up questions a spiritual seeker might ask next. "
            "Reply ONLY as a JSON array of 3 strings, no explanation. Example: [\"Q1?\", \"Q2?\", \"Q3?\"]"
        )
        result = llm.complete(prompt)
        text = result.text.strip()
        # extract JSON array from response
        start = text.find("[")
        end = text.rfind("]") + 1
        if start != -1 and end > start:
            questions = json.loads(text[start:end])
            return [q for q in questions if isinstance(q, str)][:3]
    except Exception:
        pass
    return []


def _show_web_sources() -> bool:
    # Source cards credit the original article and let readers check a mantra.
    # Set SHOW_WEB_SOURCES=false to hide them (e.g. once site owners have agreed).
    return os.getenv("SHOW_WEB_SOURCES", "true").lower() not in ("0", "false", "no")


def _answer_sources_to_schema(sources) -> list[SourceNode]:
    show_web = _show_web_sources()
    return [
        SourceNode(
            page=s.page,
            book=s.book,
            chapter=s.title or None,
            topic=s.topic,
            text_snippet=s.snippet.strip() + ("..." if len(s.snippet) >= 300 else ""),
            url=s.url,
        )
        for s in sources
        # Remedy posts (switch words, flower remedies) are offered in the answer but never listed as a source.
        if (show_web or not s.is_web) and not getattr(s, "remedy", False)
    ]


def _handle_sync(req: QueryRequest, session_id: str, user: dict | None = None) -> QueryResponse:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service"))

    from rag.answer import answer_question

    turns = _load_turns(session_id, user)  # read once; history and pending request derive from it
    history = _history_text(turns)
    pending = _pending_from(turns)

    try:
        # Whole-article context + mantra verification (see rag/answer.py). The companion may
        # instead ask clarifying questions; the original request is then kept for the next turn.
        answer, sources, asked = answer_question(
            req.question,
            history=history,
            top_k=req.top_k,
            pending_request=pending,
            previous_questions=[t["q"] for t in turns],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    suggested = [] if asked else _generate_follow_ups(req.question, answer)
    source_nodes = _answer_sources_to_schema(sources)
    _save_session_turn(
        session_id, req.question, answer,
        user=user, turns=turns, clarify=asked, request=pending or req.question,
        sources=source_nodes, suggested=suggested,
    )
    _log_query(req.question, session_id)

    return QueryResponse(
        answer=answer,
        sources=source_nodes,
        model=os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
        session_id=session_id,
        suggested_questions=suggested,
    )


def _handle_filtered(req: FilteredQueryRequest, session_id: str, user: dict | None = None) -> QueryResponse:
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
    source_nodes = _source_nodes_to_schema(response.source_nodes)
    _save_session_turn(session_id, req.question, answer, user=user, sources=source_nodes)
    _log_query(req.question, session_id, req.language or "auto")

    return QueryResponse(
        answer=answer,
        sources=source_nodes,
        model=os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
        session_id=session_id,
    )


def _handle_streaming(req: QueryRequest, session_id: str, user: dict | None = None) -> StreamingResponse:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service"))

    from rag.query_engine import get_streaming_query_engine

    turns = _load_turns(session_id, user)
    history = _history_text(turns)

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
            _save_session_turn(session_id, req.question, accumulated, user=user, turns=turns)
            _log_query(req.question, session_id)
        except Exception as exc:
            yield f"data: [ERROR] {str(exc)}\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
