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

from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

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
    In-process per-IP rate limiter.
    - Allows `max_requests` questions per `window_minutes`.
    - Once the limit is breached the IP is banned for `ban_hours`.
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
    ):
        self.max_requests = max_requests
        self.window = timedelta(minutes=window_minutes)
        self.ban_duration = timedelta(hours=ban_hours)
        self._store: dict[str, _IPState] = {}

    def _state(self, ip: str) -> _IPState:
        if ip not in self._store:
            self._store[ip] = _IPState()
        return self._store[ip]

    def __call__(self, request: Request) -> None:
        ip = (request.client.host if request.client else None) or "unknown"
        now = datetime.utcnow()
        state = self._state(ip)

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
        if state.count > self.max_requests:
            state.banned_until = now + self.ban_duration
            raise HTTPException(
                status_code=429,
                detail=(
                    f"You've asked {self.max_requests} questions in 30 minutes — "
                    "that's wonderful curiosity! Please return in 1 hour for more wisdom. 🙏"
                ),
            )


# Singleton — shared across all requests in the process
query_rate_limiter = QueryRateLimiter(max_requests=10, window_minutes=30, ban_hours=1)


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
