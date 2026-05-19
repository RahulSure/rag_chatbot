FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-hin \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
COPY platform/apps/api/requirements.txt /app/api_requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt \
    && pip install --no-cache-dir -r /app/api_requirements.txt \
    && pip install --no-cache-dir celery[redis] redis

COPY platform/ /app/platform/
COPY data/ /app/data/

ENV PYTHONPATH=/app

# Default: run Celery worker (override in docker-compose)
CMD ["celery", "-A", "platform.services.worker.celery_app", "worker", "--loglevel=info", "--concurrency=1"]
