"""
FastAPI application — RAG Chatbot over Saundarya spiritual text.

Endpoints
---------
GET  /health         Liveness check
POST /query          Ask a question (sync or streaming)
POST /ingest         Trigger (re-)ingestion pipeline
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field


class UnicodeJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(content, ensure_ascii=False, indent=2).encode("utf-8")

# Make sure project root is on sys.path when running with uvicorn from any dir
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

load_dotenv()

RESPONSES_FILE = Path(os.getenv("RESPONSES_FILE", "./responses.json"))


def _append_to_responses(question: str, response: QueryResponse) -> None:
    existing = []
    if RESPONSES_FILE.exists():
        try:
            existing = json.loads(RESPONSES_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            existing = []

    existing.append({
        "timestamp": datetime.now().isoformat(),
        "question": question,
        "answer": response.answer,
        "sources": [s.model_dump() for s in response.sources],
        "model": response.model,
    })

    RESPONSES_FILE.write_text(
        json.dumps(existing, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


app = FastAPI(
    title="Saundarya RAG Chatbot",
    description=(
        "A Retrieval-Augmented Generation chatbot over the spiritual text "
        "'Saundarya' by Sadgurudev Dr. Narayan Dutt Shrimali, "
        "powered by Krutrim LLM and ChromaDB."
    ),
    version="1.0.0",
    default_response_class=UnicodeJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question in Hindi or English")
    top_k: int = Field(5, ge=1, le=20, description="Number of context chunks to retrieve")
    stream: bool = Field(False, description="Enable token-by-token streaming response")


class SourceNode(BaseModel):
    page: Optional[int] = None
    text_snippet: str


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceNode]
    model: str


class IngestRequest(BaseModel):
    skip_ocr: bool = Field(False, description="Skip OCR step (use existing .txt files)")
    force: bool = Field(False, description="Force re-OCR and re-embedding")


class IngestResponse(BaseModel):
    status: str
    message: str


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _source_nodes_to_schema(source_nodes) -> list[SourceNode]:
    result: list[SourceNode] = []
    for node in source_nodes:
        metadata = getattr(node, "metadata", {}) or {}
        text = getattr(node, "text", "") or getattr(node.node, "text", "")
        snippet = text[:300].strip() + ("..." if len(text) > 300 else "")
        result.append(
            SourceNode(
                page=metadata.get("page"),
                text_snippet=snippet,
            )
        )
    return result


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Utility"])
def health_check():
    """Liveness check — also reports vector store document count."""
    from rag.vector_store import collection_count

    try:
        count = collection_count()
    except Exception:
        count = -1

    return {
        "status": "ok",
        "model": os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
        "vector_store_docs": count,
    }


@app.post("/query", tags=["RAG"])
def query(req: QueryRequest):
    """
    Ask a question about the Saundarya text.

    - Set `stream: true` to receive a server-sent event stream.
    - Answers are grounded in the retrieved context; the model will
      respond in the same language as the question.
    """
    if req.stream:
        return _handle_streaming(req)
    return _handle_sync(req)


def _handle_sync(req: QueryRequest) -> QueryResponse:
    from rag.query_engine import get_query_engine

    try:
        engine = get_query_engine(similarity_top_k=req.top_k)
        response = engine.query(req.question)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    result = QueryResponse(
        answer=str(response),
        sources=_source_nodes_to_schema(response.source_nodes),
        model=os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
    )
    _append_to_responses(req.question, result)
    return result


def _handle_streaming(req: QueryRequest) -> StreamingResponse:
    from rag.query_engine import get_streaming_query_engine

    def token_generator():
        try:
            engine = get_streaming_query_engine(similarity_top_k=req.top_k)
            streaming_response = engine.query(req.question)
            for token in streaming_response.response_gen:
                yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            yield f"data: [ERROR] {str(exc)}\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/ingest", response_model=IngestResponse, tags=["Pipeline"])
def ingest(req: IngestRequest, background_tasks: BackgroundTasks):
    """
    Trigger the ingestion pipeline.

    Runs in the background; returns immediately with a status message.
    Use GET /health to check `vector_store_docs` count after completion.
    """
    def _run():
        from ingestion.ingest import run_pipeline
        run_pipeline(skip_ocr=req.skip_ocr, force=req.force)

    background_tasks.add_task(_run)

    return IngestResponse(
        status="accepted",
        message=(
            "Ingestion pipeline started in the background. "
            "Poll GET /health to monitor vector_store_docs count."
        ),
    )
