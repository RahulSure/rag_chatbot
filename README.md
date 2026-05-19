# Saundarya RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot over the scanned Hindi spiritual text
**"Saundarya"** by Sadgurudev Dr. Narayan Dutt Shrimali.

Built with:
- **LlamaIndex** — orchestration, chunking, retrieval
- **ChromaDB** — local persistent vector store
- **HuggingFace** `paraphrase-multilingual-mpnet-base-v2` — Hindi-capable embeddings
- **Krutrim `gpt-oss-120b`** — LLM via custom wrapper
- **FastAPI** — REST API with streaming support

---

## Prerequisites

### System (macOS)
```bash
brew install tesseract tesseract-lang   # OCR with Hindi language pack
brew install poppler                    # pdf2image dependency
```

### Python
Python 3.10+ recommended.

```bash
python -m venv env
source env/bin/activate
pip install -r requirements.txt
```

---

## Configuration

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:

```
KRUTRIM_API_KEY=your_krutrim_api_key_here
HF_TOKEN=your_huggingface_token_here       # optional but avoids rate limits
```

All other values have working defaults and do not need to be changed.

---

## End-to-End Run Guide

### Step 1 — Ingest documents into ChromaDB

**Option A — Transcription file (recommended)**
If you have a hand-transcribed single-file transcript, use this. It gives richer
metadata (chapter number, chapter title) which improves search quality.

```bash
python -m ingestion.ingest --transcription data/processed/transcription.txt --force
```

**Option B — OCR from PDF**
Requires Tesseract installed on the system. Runs OCR on each page.

```bash
python -m ingestion.ingest          # full OCR + embed
python -m ingestion.ingest --skip-ocr   # skip OCR, use existing data/processed/*.txt
python -m ingestion.ingest --force      # wipe and re-embed everything
```

---

### Step 2 — Verify the vector store

```bash
curl http://localhost:8000/health
```

Expected output:
```json
{
  "status": "ok",
  "model": "gpt-oss-120b",
  "vector_store_docs": 56
}
```

`vector_store_docs` should be > 0. If it is 0 re-run Step 1.

---

### Step 3 — Start the API server

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Step 4 — Query the chatbot

Hindi question:
```bash
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "सौंदर्य क्या है?", "top_k": 5}' \
  | python -c "import sys,json; print(json.dumps(json.load(sys.stdin), ensure_ascii=False, indent=2))"
```

English question:
```bash
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is beauty according to Shrimali?", "top_k": 5}' \
  | python -c "import sys,json; print(json.dumps(json.load(sys.stdin), ensure_ascii=False, indent=2))"
```

Streaming mode:
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "सौंदर्य क्या है?", "stream": true}'
```

Every successful query is automatically saved to `responses.json` in the project root.

---

## API Reference

### `GET /health`
```json
{
  "status": "ok",
  "model": "gpt-oss-120b",
  "vector_store_docs": 56
}
```

### `POST /query`

| Field      | Type    | Default | Description                        |
|------------|---------|---------|------------------------------------|
| `question` | string  | —       | Question in Hindi or English       |
| `top_k`    | integer | 5       | Number of chunks to retrieve (1–20)|
| `stream`   | boolean | false   | Stream tokens via SSE              |

Response:
```json
{
  "answer": "सौंदर्य वह गुण है जो सीधे हृदय में उतर कर...",
  "sources": [
    { "page": 5, "text_snippet": "वराहमिहिर ने कहा है..." }
  ],
  "model": "gpt-oss-120b"
}
```

### `POST /ingest`
Triggers the ingestion pipeline in the background.

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"skip_ocr": true, "force": false}'
```

---

## Project Structure

```
rag_chatbot/
├── data/
│   ├── raw/                 # Source PDF (gitignored)
│   └── processed/           # OCR output — one .txt per page (gitignored)
├── llm/
│   └── krutrim_llm.py       # Custom LlamaIndex LLM wrapper for Krutrim
├── ingestion/
│   ├── ocr_extractor.py     # PDF → per-page text (pytesseract)
│   └── ingest.py            # Full ingestion pipeline
├── rag/
│   ├── embeddings.py        # HuggingFace multilingual embeddings
│   ├── vector_store.py      # ChromaDB persistent client
│   └── query_engine.py      # LlamaIndex retriever + query engine
├── api/
│   └── main.py              # FastAPI app
├── chroma_db/               # Created at runtime by ChromaDB (gitignored)
├── responses.json           # Query log — created at runtime (gitignored)
├── .env                     # Your secrets (gitignored)
├── .env.example             # Template — safe to commit
└── requirements.txt
```
