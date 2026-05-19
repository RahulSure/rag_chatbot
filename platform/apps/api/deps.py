"""
Shared dependencies for FastAPI routes: Redis client, MongoDB client, auth.
"""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from fastapi import Header, HTTPException, status

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")


# ──────────────────────────────────────────────────────────────────────────────
# Redis
# ──────────────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_redis():
    import redis
    return redis.from_url(REDIS_URL, decode_responses=True)


def get_redis_optional():
    """Returns Redis client or None if unavailable (graceful degradation)."""
    try:
        r = get_redis()
        r.ping()
        return r
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────────────────────
# MongoDB
# ──────────────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_mongo_client():
    import pymongo
    uri = os.getenv("MONGODB_URI", "")
    if not uri:
        raise ValueError("MONGODB_URI is not set")
    return pymongo.MongoClient(uri)


def get_db():
    client = get_mongo_client()
    db_name = os.getenv("MONGODB_DB_NAME", "saundarya")
    return client[db_name]


# ──────────────────────────────────────────────────────────────────────────────
# Admin auth
# ──────────────────────────────────────────────────────────────────────────────

def require_admin(x_admin_secret: str = Header(default="")):
    if not ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin access not configured",
        )
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin secret",
        )
    return True
