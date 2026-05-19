cd rag_chatbot

# Preview pages 1–5 (default), truncated at 400 chars
python -m ingestion.preview_chunks

# See pages 6–10 in full
python -m ingestion.preview_chunks --pages 6-10 --full

# All 26 pages, saved to a file you can review
python -m ingestion.preview_chunks --pages 1-26 --full --out preview.txt

# Already ran OCR before? Skip re-OCR
python -m ingestion.preview_chunks --skip-ocr --pages 1-5

uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "सौंदर्य क्या है?", "top_k": 5}'