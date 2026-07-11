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


# ──────────────────────────────────────────────────────────────────────────────
# Prometheus metrics (module-level singletons; no-op if prometheus_client absent)
# ──────────────────────────────────────────────────────────────────────────────

try:
    from prometheus_client import Counter, Histogram

    REQUEST_COUNT = Counter(
        "shrimali_http_requests_total",
        "Total HTTP request count",
        ["method", "route", "status"],
    )
    REQUEST_LATENCY = Histogram(
        "shrimali_http_request_duration_seconds",
        "HTTP request latency",
        ["method", "route"],
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
    _PROM_AVAILABLE = True
except ImportError:
    REQUEST_COUNT = REQUEST_LATENCY = QUERY_COUNT = ARTICLE_GEN_COUNT = None
    _PROM_AVAILABLE = False


def _route_template(request: Request) -> str:
    """Templated path (e.g. /articles/{slug}) to keep metric cardinality bounded."""
    route = request.scope.get("route")
    return getattr(route, "path", None) or "unmatched"


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Logs each request as structured JSON and records Prometheus metrics."""

    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response: Response = await call_next(request)
        duration_s = time.monotonic() - start

        route = _route_template(request)
        if _PROM_AVAILABLE and route != "/metrics":
            REQUEST_COUNT.labels(request.method, route, response.status_code).inc()
            REQUEST_LATENCY.labels(request.method, route).observe(duration_s)

        log = {
            "ts": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": round(duration_s * 1000, 1),
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
    """Expose Prometheus /metrics if prometheus_client is available."""
    if not _PROM_AVAILABLE:
        return
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from fastapi.responses import Response as FastAPIResponse

    @app.get("/metrics", include_in_schema=False)
    def metrics():
        return FastAPIResponse(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
