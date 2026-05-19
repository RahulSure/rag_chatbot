# Setup Guide

This project is a monorepo with two main applications:

- **Backend** — FastAPI + LlamaIndex RAG service (`platform/apps/api`)
- **Frontend** — Next.js 16 web app (`platform/apps/web`)

---

## Prerequisites

| Tool | Version | Required for |
|------|---------|-------------|
| Python | 3.11+ | Backend, RAG pipeline |
| Node.js | 20+ | Frontend |
| npm | 10+ | Frontend |
| MongoDB Atlas | — | Vector store (cloud) |
| Redis | 7+ | Session cache, Celery broker |

---

## Environment Variables

Copy `.env.example` to `.env` at the project root and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `KRUTRIM_API_KEY` | Krutrim LLM API key | — |
| `KRUTRIM_MODEL` | Model name | `gpt-oss-120b` |
| `MONGODB_URI` | MongoDB Atlas connection string | — |
| `MONGODB_DB_NAME` | Database name | `saundarya` |
| `ADMIN_SECRET` | Secret for admin endpoints | — |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `CELERY_BROKER_URL` | Celery broker | `redis://localhost:6379/0` |
| `CELERY_RESULT_BACKEND` | Celery result backend | `redis://localhost:6379/1` |
| `EMBEDDING_MODEL` | HuggingFace model | `sentence-transformers/paraphrase-multilingual-mpnet-base-v2` |
| `HF_TOKEN` | HuggingFace token (optional, avoids rate limits) | — |

For the frontend, create `platform/apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Option A — Docker Compose (Recommended)

Runs all services (api, web, redis, worker, beat) with a single command.

```bash
cd platform/infrastructure

# Start core services
docker compose up --build

# With monitoring (Prometheus + Grafana)
docker compose --profile monitoring up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Redis | localhost:6379 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

Stop everything:

```bash
docker compose down
```

---

## Option B — Local Development

### 1. Backend (FastAPI)

From the project root:

```bash
# Create and activate a virtual environment
python -m venv env
source env/bin/activate          # Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r platform/apps/api/requirements.txt

# Start the API server (run from project root)
python -m uvicorn apps.api.main:app --app-dir platform --reload --host 0.0.0.0 --port 8000
```

The API will be available at **http://localhost:8000**.  
Interactive docs: **http://localhost:8000/docs**

### 2. Frontend (Next.js)

```bash
cd platform/apps/web

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at **http://localhost:3000**.  
It proxies `/api/v1/*` requests to the backend at `http://localhost:8000`.

### 3. Redis (required for sessions and Celery)

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Linux
sudo systemctl start redis

# Docker (one-liner)
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Celery Worker (optional — needed for article generation)

```bash
# From the project root, with venv activated
celery -A platform.services.worker.celery_app worker --loglevel=info --concurrency=2
```

### 5. Celery Beat (optional — needed for scheduled tasks)

```bash
# Daily article generation at 2 AM IST, weekly trending reset on Mondays
celery -A platform.services.worker.celery_app beat --loglevel=info
```

---

## Running the Ingestion Pipeline

Before the RAG query engine can answer questions, you need to ingest books into MongoDB.

### Step 1 — Transcribe a PDF (if not already done)

```bash
# Transcribe last 100 pages of Mantra Rahasya (takes ~20–30 min, EasyOCR)
python -m ingestion.transcribe_pages \
    --pdf "data/raw/Mantra Rahasya.pdf" \
    --start 285 --end 384 \
    --out data/processed/mantra_rahasya_transcription.txt
```

Use `--resume` to continue an interrupted run without re-doing completed pages.

### Step 2 — Ingest into MongoDB

```bash
# Saundarya
python -m ingestion.ingest \
    --transcription data/processed/transcription.md \
    --book saundarya \
    --book-name "Saundarya" \
    --book-slug "saundarya"

# Mantra Rahasya
python -m ingestion.ingest \
    --transcription data/processed/mantra_rahasya_transcription.txt \
    --book mantra_rahasya \
    --book-name "Mantra Rahasya" \
    --book-slug "mantra-rahasya" \
    --force
```

`--force` overwrites existing vectors. Omit it to skip ingestion if the collection already has data.

---

## API Endpoints

```
GET  /health                    Health check
POST /query                     RAG query (sync or SSE streaming)
POST /query/filtered            Query with book/topic/language filters
GET  /books                     List all books
GET  /topics                    List all topics
GET  /articles                  List articles
GET  /articles/{slug}           Get article by slug
GET  /daily-wisdom              Daily wisdom passage
GET  /search                    Full-text search
GET  /analytics/trending        Trending queries
GET  /analytics/stats           Usage statistics
POST /admin/ingest              Trigger ingestion (admin)
POST /admin/upload              Upload document (admin)
DELETE /admin/books/{slug}      Delete a book (admin)
```

Admin endpoints require the `X-Admin-Secret` header matching `ADMIN_SECRET`.

---

## Project Structure

```
platform/
├── apps/
│   ├── api/              # FastAPI backend
│   │   ├── main.py       # App entry point
│   │   ├── deps.py       # Redis, MongoDB, auth dependencies
│   │   ├── middleware.py  # Logging and metrics
│   │   ├── requirements.txt
│   │   └── routers/      # query, books, articles, wisdom, analytics, admin
│   └── web/              # Next.js frontend
│       ├── app/          # App Router pages (chat, blog, admin, ...)
│       ├── components/   # React components
│       ├── lib/          # api.ts, useStream.ts
│       └── package.json
├── services/
│   ├── rag-service/      # RAG pipeline (ingestion, query engine, embeddings)
│   ├── article-engine/   # AI article generation
│   └── worker/           # Celery config + beat schedule
├── packages/
│   ├── shared/           # Shared Pydantic schemas
│   └── prompts/          # Prompt templates
└── infrastructure/
    ├── docker-compose.yml
    ├── docker/           # Dockerfiles (api, web, worker)
    ├── k8s/              # Kubernetes manifests
    └── monitoring/       # Prometheus config
```
