"""
Observability middleware — structured logging + Prometheus metrics.
Also provides QueryRateLimiter: 10 questions / 30 min per IP,
then a 1-hour cooldown if the limit is exceeded.
"""

from __future__ import annotations

import time
import os
import logging
import json
from datetime import datetime, timedelta

from fastapi import Depends, Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from apps.api.auth import get_current_user_optional

logger = logging.getLogger("shrimali.api")


# ─────────────────────────────────────────────────────────────────────────────
# Rate Limiter — 10 questions / 30 min per IP, 1-hour ban on breach
# ─────────────────────────────────────────────────────────────────────────────

class _IPState:
    __slots__ = ("count", "window_start", "banned_until")

    def __init__(self):
        self.count: int = 0
        self.window_start: datetime = datetime.utcnow()
        self.banned_until: datetime | None = None


class QueryRateLimiter:
    """
    In-process rate limiter, keyed per user when signed in and per IP otherwise.
    - Anonymous visitors get `max_requests` questions per `window_minutes`;
      signed-in users get `max_requests_user`.
    - Once the limit is breached the key is banned for `ban_hours`.
    Usage as a FastAPI dependency:

        @router.post("")
        def query(req: ..., _=Depends(query_rate_limiter)):
            ...
    """

    def __init__(
        self,
        max_requests: int = 10,
        window_minutes: int = 30,
        ban_hours: int = 1,
        max_requests_user: int | None = None,
    ):
        self.max_requests = max_requests
        self.max_requests_user = max_requests_user or max_requests
        self.window = timedelta(minutes=window_minutes)
        self.ban_duration = timedelta(hours=ban_hours)
        self._store: dict[str, _IPState] = {}

    def _state(self, key: str) -> _IPState:
        if key not in self._store:
            self._store[key] = _IPState()
        return self._store[key]

    def __call__(self, request: Request, user: dict | None = Depends(get_current_user_optional)) -> None:
        if user is not None:
            key, limit = f"user:{user['_id']}", self.max_requests_user
        else:
            ip = (request.client.host if request.client else None) or "unknown"
            key, limit = f"ip:{ip}", self.max_requests
        now = datetime.utcnow()
        state = self._state(key)

        # Still banned?
        if state.banned_until and now < state.banned_until:
            remaining_secs = int((state.banned_until - now).total_seconds())
            remaining_mins = max(1, (remaining_secs + 59) // 60)
            raise HTTPException(
                status_code=429,
                detail=(
                    f"You've reached your question limit. "
                    f"Please come back in {remaining_mins} minute"
                    f"{'s' if remaining_mins != 1 else ''}. "
                    "Take a moment to reflect on the answers received. 🙏"
                ),
            )

        # Reset window if it has expired
        if now - state.window_start >= self.window:
            state.count = 0
            state.window_start = now
            state.banned_until = None

        state.count += 1

        # Breach — impose ban
        if state.count > limit:
            state.banned_until = now + self.ban_duration
            hint = (
                ""
                if user is not None or self.max_requests_user <= self.max_requests
                else f" Sign in with Google to ask up to {self.max_requests_user}."
            )
            raise HTTPException(
                status_code=429,
                detail=(
                    f"You've asked {limit} questions in 30 minutes — "
                    "that's wonderful curiosity! Please return in 1 hour for more wisdom. 🙏" + hint
                ),
            )


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


# Singleton — shared across all requests in the process
query_rate_limiter = QueryRateLimiter(
    max_requests=_env_int("RATE_LIMIT_ANON", 10),
    max_requests_user=_env_int("RATE_LIMIT_USER", 30),
    window_minutes=30,
    ban_hours=1,
)


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Logs each request as structured JSON."""

    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response: Response = await call_next(request)
        duration_ms = (time.monotonic() - start) * 1000

        log = {
            "ts": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": round(duration_ms, 1),
            "ip": request.client.host if request.client else None,
        }
        logger.info(json.dumps(log, ensure_ascii=False))
        return response


def setup_logging():
    """Configure structured JSON logging for production."""
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format="%(message)s",
    )


def add_metrics_endpoint(app):
    """Add Prometheus /metrics endpoint if prometheus_client is available."""
    try:
        from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
        from prometheus_client import multiprocess, CollectorRegistry
        from fastapi.responses import Response as FastAPIResponse

        REQUEST_COUNT = Counter(
            "shrimali_http_requests_total",
            "Total HTTP request count",
            ["method", "path", "status"],
        )
        REQUEST_LATENCY = Histogram(
            "shrimali_http_request_duration_seconds",
            "HTTP request latency",
            ["method", "path"],
        )
        QUERY_COUNT = Counter(
            "shrimali_rag_queries_total",
            "Total RAG queries processed",
            ["language"],
        )
        ARTICLE_GEN_COUNT = Counter(
            "shrimali_articles_generated_total",
            "Total articles generated",
            ["topic", "status"],
        )

        @app.get("/metrics", include_in_schema=False)
        def metrics():
            return FastAPIResponse(
                content=generate_latest(),
                media_type=CONTENT_TYPE_LATEST,
            )

        return REQUEST_COUNT, REQUEST_LATENCY, QUERY_COUNT, ARTICLE_GEN_COUNT

    except ImportError:
        return None, None, None, None
