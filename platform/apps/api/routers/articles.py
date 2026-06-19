"""
Articles CRUD endpoints — list, get, generate, approve.
"""

from __future__ import annotations

import os
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from packages.shared.schemas import (
    ArticleResponse,
    ArticleListItem,
    ArticleGenerateRequest,
    ArticleApproveRequest,
    FAQItem,
)
from apps.api.deps import get_db, require_admin

router = APIRouter(prefix="/articles", tags=["Articles"])


def _doc_to_article(doc: dict) -> ArticleResponse:
    return ArticleResponse(
        id=str(doc["_id"]),
        slug=doc.get("slug", ""),
        title=doc.get("title", ""),
        meta_description=doc.get("meta_description", ""),
        body_mdx=doc.get("body_mdx", ""),
        faq=[FAQItem(**f) for f in doc.get("faq", [])],
        tags=doc.get("tags", []),
        topic=doc.get("topic", ""),
        source_books=doc.get("source_books", []),
        status=doc.get("status", "draft"),
        created_at=doc.get("created_at", datetime.utcnow()),
        published_at=doc.get("published_at"),
        seo_score=doc.get("seo_score"),
        cover_image_url=doc.get("cover_image_url"),
    )


def _doc_to_list_item(doc: dict) -> ArticleListItem:
    return ArticleListItem(
        id=str(doc["_id"]),
        slug=doc.get("slug", ""),
        title=doc.get("title", ""),
        meta_description=doc.get("meta_description", ""),
        tags=doc.get("tags", []),
        topic=doc.get("topic", ""),
        status=doc.get("status", "draft"),
        published_at=doc.get("published_at"),
        cover_image_url=doc.get("cover_image_url"),
    )


@router.get("", response_model=list[ArticleListItem])
def list_articles(
    status: str = Query("published"),
    topic: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
):
    """List articles. Public endpoint returns published only."""
    db = get_db()
    query: dict = {"status": status}
    if topic:
        query["topic"] = topic
    docs = list(db["articles"].find(query, {"body_mdx": 0}).sort("published_at", -1).skip(skip).limit(limit))
    return [_doc_to_list_item(d) for d in docs]


@router.get("/{slug}", response_model=ArticleResponse)
def get_article(slug: str):
    """Get full article by slug."""
    db = get_db()
    doc = db["articles"].find_one({"slug": slug, "status": "published"})
    if not doc:
        raise HTTPException(status_code=404, detail="Article not found")
    return _doc_to_article(doc)


@router.post("/generate", dependencies=[Depends(require_admin)])
def trigger_article_generation(req: ArticleGenerateRequest):
    """Trigger AI article generation for a topic (admin only)."""
    from services.article_engine.generator import generate_article_sync
    result = generate_article_sync(
        topic=req.topic,
        primary_keyword=req.primary_keyword,
        book_slugs=req.book_slugs,
        language=req.language,
    )
    return {"status": "generated", "article_id": result.get("id"), "topic": req.topic}


@router.post("/{article_id}/approve", dependencies=[Depends(require_admin)])
def approve_article(article_id: str, req: ArticleApproveRequest):
    """Approve or publish an article (admin only)."""
    db = get_db()
    try:
        oid = ObjectId(article_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid article ID")

    update: dict = {"$set": {"status": req.status}}
    if req.status == "published":
        update["$set"]["published_at"] = datetime.utcnow()

    result = db["articles"].update_one({"_id": oid}, update)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"status": "updated", "article_id": article_id, "new_status": req.status}


@router.delete("/{article_id}", dependencies=[Depends(require_admin)])
def delete_article(article_id: str):
    """Delete an article (admin only)."""
    db = get_db()
    try:
        oid = ObjectId(article_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid article ID")
    result = db["articles"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"status": "deleted", "article_id": article_id}
