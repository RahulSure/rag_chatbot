"""
Books & topics endpoints — catalog of ingested spiritual texts.
"""

from __future__ import annotations

from fastapi import APIRouter

from packages.shared.schemas import BookMeta, TopicResponse
from apps.api.deps import get_db

router = APIRouter(tags=["Knowledge Base"])

SPIRITUAL_TOPICS = [
    TopicResponse(slug="tantra", label="Tantra", label_hi="तंत्र",
                  description="Ancient science of energy and ritual transformation",
                  icon="🕉"),
    TopicResponse(slug="mantra", label="Mantra", label_hi="मंत्र",
                  description="Sacred sound vibrations for spiritual awakening",
                  icon="🔔"),
    TopicResponse(slug="sadhana", label="Sadhana", label_hi="साधना",
                  description="Spiritual practice and disciplined pursuit of the divine",
                  icon="🪔"),
    TopicResponse(slug="kundalini", label="Kundalini", label_hi="कुंडलिनी",
                  description="The dormant divine energy coiled at the base of the spine",
                  icon="🐍"),
    TopicResponse(slug="jyotish", label="Jyotish", label_hi="ज्योतिष",
                  description="Vedic astrology and planetary science",
                  icon="⭐"),
    TopicResponse(slug="yantra", label="Yantra", label_hi="यंत्र",
                  description="Sacred geometric diagrams as tools for meditation",
                  icon="🔷"),
    TopicResponse(slug="meditation", label="Meditation", label_hi="ध्यान",
                  description="The art of turning inward to meet the Self",
                  icon="🧘"),
    TopicResponse(slug="beauty_spirituality", label="Saundarya", label_hi="सौन्दर्य",
                  description="The spiritual dimension of beauty and divine aesthetics",
                  icon="🌸"),
    TopicResponse(slug="guru_teachings", label="Guru Teachings", label_hi="गुरु उपदेश",
                  description="Direct wisdom from Sadgurudev's discourses",
                  icon="📿"),
    TopicResponse(slug="siddhashram", label="Siddhashram", label_hi="सिद्धाश्रम",
                  description="The mystical realm of perfected masters",
                  icon="🏔"),
]


@router.get("/books", response_model=list[BookMeta])
def list_books():
    """List all ingested books with metadata."""
    try:
        db = get_db()
        pipeline = [
            {"$group": {
                "_id": "$metadata.book_slug",
                "name": {"$first": "$metadata.book"},
                "language": {"$first": "$metadata.language"},
                "author": {"$first": "$metadata.author"},
                "tags": {"$first": "$metadata.tags"},
                "chunk_count": {"$sum": 1},
            }},
            {"$match": {"_id": {"$ne": None}}},
        ]
        results = list(db["embeddings"].aggregate(pipeline))
        books = []
        for r in results:
            books.append(BookMeta(
                slug=r["_id"] or "unknown",
                name=r.get("name") or "Unknown Book",
                language=r.get("language") or "hi",
                author=r.get("author") or "Dr. Narayan Dutt Shrimali",
                tags=r.get("tags") or [],
                chunk_count=r.get("chunk_count", 0),
            ))
        return books
    except Exception:
        return [
            BookMeta(
                slug="saundarya",
                name="Saundarya",
                language="hi",
                author="Dr. Narayan Dutt Shrimali",
                tags=["beauty", "spirituality", "sadhana"],
                description="A spiritual guide to the divine beauty that underlies all existence",
            )
        ]


@router.get("/topics", response_model=list[TopicResponse])
def list_topics():
    """List all spiritual topics with chunk and article counts."""
    try:
        db = get_db()
        pipeline = [
            {"$group": {"_id": "$metadata.topic", "chunk_count": {"$sum": 1}}},
            {"$match": {"_id": {"$ne": None}}},
        ]
        counts = {r["_id"]: r["chunk_count"] for r in db["embeddings"].aggregate(pipeline)}
        article_counts = {}
        for art in db["articles"].find({"status": "published"}, {"topic": 1}):
            t = art.get("topic", "")
            article_counts[t] = article_counts.get(t, 0) + 1

        topics = []
        for t in SPIRITUAL_TOPICS:
            t.chunk_count = counts.get(t.slug, 0)
            t.article_count = article_counts.get(t.slug, 0)
            topics.append(t)
        return topics
    except Exception:
        return SPIRITUAL_TOPICS
