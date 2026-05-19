# Platform Folder — Cleanup & Sync Plan

Audit of `/platform` against the current root-level development state.

---

## Phase 1 — Delete Redundant Files

Files that serve no purpose and are safe to remove immediately.

| File / Folder | Reason |
|---------------|--------|
| `platform/services/rag-service/ingestion/ocr_extractor.py` | Uses Tesseract (pytesseract) — cannot be installed; replaced by EasyOCR + LlamaCloud |

**Commands:**
```bash
rm platform/services/rag-service/ingestion/ocr_extractor.py
```

---

## Phase 2 — Sync Stale Files with Root Changes

These files exist in the platform but are behind the root-level work done in this project.

### 2a. Embedding model mismatch
**File:** `platform/services/rag-service/rag/embeddings.py`

- **Problem:** Uses `paraphrase-multilingual-MiniLM-L12-v2`
- **Root uses:** `paraphrase-multilingual-mpnet-base-v2` (768 dimensions)
- **Impact:** Dimension mismatch — queries will fail if vectors were indexed with one model and queried with another
- **Fix:** Update model name to `sentence-transformers/paraphrase-multilingual-mpnet-base-v2`

### 2b. Outdated transcription loader
**File:** `platform/services/rag-service/ingestion/load_transcription.py`

- **Problem:** Old version — hardcoded Saundarya chapter map, no support for Mantra Rahasya
- **Root has:** Flexible `chapter_map` parameter, `load_saundarya_transcription()`, `load_mantra_rahasya_transcription()` wrappers
- **Fix:** Replace with updated root version (`ingestion/load_transcription.py`)

### 2c. Outdated Python requirements
**File:** `platform/apps/api/requirements.txt`

- **Problem:** Lists `pdf2image` and `pytesseract` (Tesseract-based OCR — cannot be installed)
- **Fix:** Replace with:
  - `easyocr` — EasyOCR for Hindi OCR
  - `pymupdf` — PDF rendering (replaces pdf2image, no system deps)
  - Remove: `pdf2image`, `pytesseract`

### 2d. Dockerfile installs Tesseract
**File:** `platform/infrastructure/docker/api.Dockerfile`

- **Problem:** Installs `tesseract-ocr` and `tesseract-ocr-hin` system packages
- **Fix:** Remove those apt-get lines; EasyOCR and PyMuPDF are pure Python — no system packages needed

---

## Phase 3 — Verify End-to-End

After phases 1 and 2 are done, run the full stack locally:

```bash
# From platform/
docker compose up --build

# Test the query endpoint
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "मन्त्र क्या है?", "language": "hi"}'
```

Verify:
- [ ] `/health` returns 200
- [ ] `/query` returns an answer with sources
- [ ] `/books` lists ingested books
- [ ] `/daily-wisdom` returns a passage
- [ ] Frontend loads at `http://localhost:3000`

---

## Files to Keep (Reference)

| Path | Purpose |
|------|---------|
| `apps/api/` | FastAPI backend — all routers, middleware, deps |
| `apps/web/` | Next.js frontend — pages, components, API client |
| `services/rag-service/rag/` | Query engine, embeddings, vector store |
| `services/rag-service/ingestion/ingest.py` | Main ingestion pipeline |
| `services/rag-service/llm/krutrim_llm.py` | Krutrim LLM wrapper |
| `services/article-engine/` | AI article generator + Celery tasks |
| `services/worker/celery_app.py` | Celery + Redis configuration |
| `packages/shared/schemas.py` | Shared Pydantic models across services |
| `packages/prompts/` | RAG and article prompt templates |
| `infrastructure/docker/` | Dockerfiles for api, web, worker |
| `infrastructure/docker-compose.yml` | Local multi-service orchestration |