"""
Observability middleware — structured logging + Prometheus metrics.
"""

from __future__ import annotations

import time
import os
import logging
import json
from datetime import datetime

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("shrimali.api")


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
