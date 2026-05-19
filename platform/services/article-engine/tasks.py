"""
Celery tasks for automated article generation.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_ROOT / "services" / "rag-service"))
sys.path.insert(0, str(_ROOT / "packages"))
sys.path.insert(0, str(_ROOT))

from services.worker.celery_app import app as celery_app

SPIRITUAL_TOPICS = [
    ("tantra", "tantra sadhana in hindi"),
    ("mantra", "mantra siddhi"),
    ("kundalini", "kundalini awakening"),
    ("sadhana", "spiritual sadhana"),
    ("jyotish", "vedic astrology shrimali"),
    ("yantra", "yantra meditation"),
    ("meditation", "meditation techniques hindi"),
    ("beauty_spirituality", "saundarya sadhana"),
    ("guru_teachings", "sadgurudev teachings"),
    ("siddhashram", "siddhashram mystery"),
]


@celery_app.task(name="services.article_engine.tasks.generate_article_task", bind=True, max_retries=2)
def generate_article_task(self, topic: str, primary_keyword: str, book_slugs: list = None, language: str = "en"):
    """Generate a single article for the given topic."""
    try:
        from services.article_engine.generator import generate_article_sync
        result = generate_article_sync(
            topic=topic,
            primary_keyword=primary_keyword,
            book_slugs=book_slugs or [],
            language=language,
        )
        return {"status": "success", "article_id": result.get("id"), "slug": result.get("slug")}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="services.article_engine.tasks.auto_generate_articles")
def auto_generate_articles():
    """
    Daily cron: pick uncovered topics and generate articles for them.
    Runs at 2 AM IST via Celery Beat.
    """
    from apps.api.deps import get_db
    from services.article_engine.generator import generate_article_sync

    try:
        db = get_db()
        existing_topics = [d["topic"] for d in db["articles"].find({}, {"topic": 1})]
    except Exception:
        existing_topics = []

    generated = []
    for topic, keyword in SPIRITUAL_TOPICS:
        topic_count = existing_topics.count(topic)
        if topic_count < 3:
            try:
                result = generate_article_sync(topic=topic, primary_keyword=keyword)
                generated.append(result.get("slug"))
            except Exception as e:
                print(f"[article-engine] Failed to generate for {topic}: {e}")

    return {"generated": generated, "count": len(generated)}


@celery_app.task(name="services.article_engine.tasks.reset_trending_queries")
def reset_trending_queries():
    """Weekly: archive and reset trending query counters in Redis."""
    try:
        from apps.api.deps import get_redis_optional, get_db
        r = get_redis_optional()
        if not r:
            return {"status": "redis_unavailable"}

        items = r.zrevrange("trending_queries", 0, -1, withscores=True)
        if items:
            db = get_db()
            db["trending_archive"].insert_one({
                "week_ending": __import__("datetime").datetime.utcnow().isoformat(),
                "queries": [{"query": q, "count": int(s)} for q, s in items],
            })
        r.delete("trending_queries")
        return {"status": "reset", "archived": len(items)}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
