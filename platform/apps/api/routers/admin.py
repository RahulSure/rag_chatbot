"""
Admin endpoints — PDF upload, ingestion trigger, book management.
"""

from __future__ import annotations

import os
import shutil
import tempfile
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

from packages.shared.schemas import IngestRequest, IngestResponse, VectorStoreHealth
from apps.api.deps import get_db, require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))


@router.get("/health", response_model=VectorStoreHealth)
def admin_health():
    """Detailed health check with vector store info."""
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service"))

    try:
        from rag.vector_store import collection_count
        count = collection_count()
    except Exception:
        count = -1

    try:
        db = get_db()
        last_log = db["query_logs"].find_one({}, sort=[("timestamp", -1)])
        last_ingestion = last_log.get("timestamp") if last_log else None
    except Exception:
        last_ingestion = None

    return VectorStoreHealth(
        status="ok",
        vector_store_docs=count,
        model=os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
        last_ingestion=last_ingestion,
    )


@router.post("/upload", dependencies=[Depends(require_admin)])
async def upload_book(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    book_name: str = Form(...),
    book_slug: str = Form(...),
    language: str = Form("hi"),
    tags: str = Form("spiritual,sadhana"),
    force: bool = Form(False),
):
    """Upload a new PDF book and trigger ingestion in the background."""
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    raw_dir = DATA_DIR / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    dest = raw_dir / f"{book_slug}.pdf"

    content = await file.read()
    dest.write_bytes(content)

    processed_dir = DATA_DIR / "processed" / book_slug

    def _run_ingestion():
        import sys
        sys.path.insert(
            0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service")
        )
        from ingestion.ingest import run_pipeline
        run_pipeline(
            skip_ocr=False,
            force=force,
            book_name=book_name,
            book_slug=book_slug,
            language=language,
            tags=[t.strip() for t in tags.split(",")],
        )

    background_tasks.add_task(_run_ingestion)

    return {
        "status": "accepted",
        "message": f"Book '{book_name}' uploaded. Ingestion started in background.",
        "book_slug": book_slug,
        "file_size_bytes": len(content),
    }


@router.post("/ingest", response_model=IngestResponse, dependencies=[Depends(require_admin)])
def trigger_ingestion(req: IngestRequest, background_tasks: BackgroundTasks):
    """Trigger ingestion pipeline for an already-uploaded book."""
    def _run():
        import sys
        sys.path.insert(
            0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service")
        )
        from ingestion.ingest import run_pipeline
        run_pipeline(
            skip_ocr=req.skip_ocr,
            force=req.force,
            book_name=req.book_name,
            book_slug=req.book_slug,
            language=req.language,
            tags=req.tags,
        )

    background_tasks.add_task(_run)
    return IngestResponse(
        status="accepted",
        message=f"Ingestion started for '{req.book_name}'. Poll /admin/health for progress.",
    )


@router.delete("/books/{book_slug}", dependencies=[Depends(require_admin)])
def delete_book_vectors(book_slug: str):
    """Remove all vectors for a specific book from MongoDB."""
    try:
        db = get_db()
        collection_name = os.getenv("MONGODB_COLLECTION", "embeddings")
        result = db[collection_name].delete_many({"metadata.book_slug": book_slug})
        return {
            "status": "deleted",
            "book_slug": book_slug,
            "vectors_removed": result.deleted_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/books", dependencies=[Depends(require_admin)])
def admin_list_books():
    """List all books in vector store with chunk counts (admin view)."""
    try:
        db = get_db()
        pipeline = [
            {"$group": {
                "_id": "$metadata.book_slug",
                "name": {"$first": "$metadata.book"},
                "language": {"$first": "$metadata.language"},
                "chunk_count": {"$sum": 1},
            }},
        ]
        return list(db["embeddings"].aggregate(pipeline))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
