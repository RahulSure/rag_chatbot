"""
Analytics endpoints — trending queries, usage stats.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from packages.shared.schemas import TrendingQuery
from apps.api.deps import get_db, get_redis_optional

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/trending", response_model=list[TrendingQuery])
def get_trending_queries(limit: int = Query(10, ge=1, le=50)):
    """Top queries from the last 7 days."""
    r = get_redis_optional()
    if r:
        items = r.zrevrange("trending_queries", 0, limit - 1, withscores=True)
        return [TrendingQuery(query=q, count=int(score)) for q, score in items]

    try:
        db = get_db()
        since = datetime.utcnow() - timedelta(days=7)
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {"_id": "$query", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit},
        ]
        results = list(db["query_logs"].aggregate(pipeline))
        return [TrendingQuery(query=r["_id"], count=r["count"]) for r in results]
    except Exception:
        return []


@router.get("/stats")
def get_platform_stats():
    """High-level platform usage stats for admin dashboard."""
    try:
        db = get_db()
        since_7d = datetime.utcnow() - timedelta(days=7)
        since_30d = datetime.utcnow() - timedelta(days=30)

        total_queries = db["query_logs"].count_documents({})
        queries_7d = db["query_logs"].count_documents({"timestamp": {"$gte": since_7d}})
        queries_30d = db["query_logs"].count_documents({"timestamp": {"$gte": since_30d}})
        total_articles = db["articles"].count_documents({})
        published_articles = db["articles"].count_documents({"status": "published"})
        draft_articles = db["articles"].count_documents({"status": "draft"})
        vector_docs = db["embeddings"].count_documents({})

        return {
            "queries": {
                "total": total_queries,
                "last_7_days": queries_7d,
                "last_30_days": queries_30d,
            },
            "articles": {
                "total": total_articles,
                "published": published_articles,
                "draft": draft_articles,
                "pending_approval": total_articles - published_articles - draft_articles,
            },
            "knowledge_base": {
                "vector_chunks": vector_docs,
            },
        }
    except Exception as e:
        return {"error": str(e)}
