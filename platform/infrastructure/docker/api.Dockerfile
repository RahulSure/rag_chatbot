FROM python:3.11-slim

WORKDIR /app

# System dependencies (EasyOCR and PyMuPDF are pure Python — no system OCR packages needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt /app/requirements.txt
COPY platform/apps/api/requirements.txt /app/api_requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt \
    && pip install --no-cache-dir -r /app/api_requirements.txt

# Copy application code
COPY platform/ /app/platform/
COPY data/ /app/data/

# Set Python path
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "platform.apps.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
