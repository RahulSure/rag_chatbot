# Shrimali AI Spiritual Platform

A Retrieval-Augmented Generation (RAG) platform over the Hindi spiritual texts of
**Sadgurudev Dr. Narayan Dutt Shrimali**. Ask questions in Hindi, Hinglish, or English
and get answers grounded in the source books, with automatic book-aware context
switching across a conversation.

Books currently ingested: **Saundarya**, **Mantra Rahasya**, **Apsara Sadhna**.

## Architecture

- **LlamaIndex** — orchestration, chunking, retrieval
- **MongoDB Atlas Vector Search** — cloud vector store (768-dim, cosine)
- **HuggingFace** `paraphrase-multilingual-mpnet-base-v2` — Hindi-capable embeddings
- **Krutrim `gpt-oss-120b`** — LLM via a custom LlamaIndex wrapper
- **FastAPI** — REST API with SSE streaming + Redis-backed session memory
- **Next.js 16** — frontend web app
- **Redis** — session cache + Celery broker
- **Celery** — background article generation (optional)

This is a monorepo under [`platform/`](platform/):

```
platform/
├── apps/
│   ├── api/              # FastAPI backend (routers: query, books, articles, wisdom, analytics, admin)
│   └── web/              # Next.js frontend
├── services/
│   ├── rag-service/      # RAG pipeline: ingestion, embeddings, vector_store, query_engine, router
│   ├── article-engine/   # AI article generation
│   └── worker/           # Celery config + beat schedule
├── packages/
│   ├── shared/           # Shared Pydantic schemas
│   └── prompts/          # Prompt templates
└── infrastructure/       # docker-compose, Dockerfiles, k8s manifests, monitoring
```

## Quick start

Full instructions — environment variables, Docker Compose, local dev, ingestion,
and the API reference — are in **[SETUP.md](SETUP.md)**.

```bash
# 1. Configure
cp .env.example .env        # fill in KRUTRIM_API_KEY, MONGODB_URI, ADMIN_SECRET, ...

# 2. Run everything with Docker (recommended)
cd platform/infrastructure && docker compose up --build
#   Frontend → http://localhost:3000   API → http://localhost:8000

# 3. Or run the API locally
python -m venv env && source env/bin/activate
pip install -r requirements.txt -r platform/apps/api/requirements.txt
python -m uvicorn apps.api.main:app --app-dir platform --reload --port 8000
```

## Ingesting a new book

The pipeline (OCR → chunk → embed → upsert to MongoDB Atlas) lives in
`platform/services/rag-service/ingestion/`. See [SETUP.md](SETUP.md#running-the-ingestion-pipeline)
for the transcribe + ingest commands. For scanned two-up PDFs, pass `--two-up` to
`transcribe_pages`.

## Production readiness

See [docs/PRODUCTION_PLAN.md](docs/PRODUCTION_PLAN.md) for the deployment plan and
[PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for the gap analysis and test results.
