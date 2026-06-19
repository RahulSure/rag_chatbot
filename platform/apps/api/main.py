"""
Shrimali AI Platform — FastAPI Backend

Endpoints:
  GET  /health
  POST /query              (sync + SSE streaming, session memory)
  POST /query/filtered     (book/topic/language filters)
  GET  /books
  GET  /topics
  GET  /articles
  GET  /articles/{slug}
  POST /articles/generate  (admin)
  POST /articles/{id}/approve (admin)
  GET  /daily-wisdom
  GET  /search
  GET  /analytics/trending
  GET  /analytics/stats
  GET  /admin/health       (admin)
  POST /admin/upload       (admin)
  POST /admin/ingest       (admin)
  DELETE /admin/books/{slug} (admin)
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Suppress HuggingFace Hub remote cache-validation calls when model is already cached.
# Must be set before any huggingface_hub or sentence-transformers import.
os.environ.setdefault("HF_HUB_OFFLINE", "1")

# Ensure services/rag-service and packages are importable
_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_ROOT / "services" / "rag-service"))
sys.path.insert(0, str(_ROOT / "packages"))
sys.path.insert(0, str(_ROOT))

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

from apps.api.routers import query, books, articles, wisdom, analytics, admin, subscribe
from apps.api.middleware import StructuredLoggingMiddleware, setup_logging, add_metrics_endpoint

setup_logging()


class UnicodeJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(content, ensure_ascii=False, indent=2).encode("utf-8")


app = FastAPI(
    title="Shrimali AI Spiritual Platform",
    description=(
        "The definitive AI-powered knowledge platform for the spiritual teachings "
        "of Dr. Narayan Dutt Shrimali (Sadgurudev Nikhileshwaranand). "
        "Powered by LlamaIndex, MongoDB Atlas, and Krutrim LLM."
    ),
    version="2.0.0",
    default_response_class=UnicodeJSONResponse,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(StructuredLoggingMiddleware)

# Prometheus metrics endpoint
add_metrics_endpoint(app)

# Register routers
app.include_router(query.router)
app.include_router(books.router)
app.include_router(articles.router)
app.include_router(wisdom.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(subscribe.router)


@app.get("/health", tags=["Utility"])
def health_check():
    """Liveness check with vector store stats."""
    sys.path.insert(0, str(_ROOT / "services" / "rag-service"))
    try:
        from rag.vector_store import collection_count
        count = collection_count()
    except Exception:
        count = -1

    return {
        "status": "ok",
        "platform": "Shrimali AI Spiritual Platform v2",
        "model": os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
        "vector_store_docs": count,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
