"""
Celery application configuration for background task processing.
"""

from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

from celery import Celery
from celery.schedules import crontab

BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

app = Celery(
    "shrimali_platform",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
    include=["services.article_engine.tasks"],
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

app.conf.beat_schedule = {
    "generate-daily-articles": {
        "task": "services.article_engine.tasks.auto_generate_articles",
        "schedule": crontab(hour=2, minute=0),  # daily at 2 AM IST
        "args": (),
    },
    "reset-trending-weekly": {
        "task": "services.article_engine.tasks.reset_trending_queries",
        "schedule": crontab(hour=0, minute=0, day_of_week="monday"),
    },
}

if __name__ == "__main__":
    app.start()
