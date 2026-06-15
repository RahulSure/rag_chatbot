"""
Ingestion pipeline — load → chunk → embed → upsert into MongoDB Atlas.

Two source modes:
  --transcription PATH   Use a single-file annotated transcript (recommended).
                         Use --book to select the chapter map.
  (default / OCR mode)   Load per-page .txt files from PROCESSED_TEXT_DIR.
                         Generate them first with:
                           python -m ingestion.transcribe_pages

Usage:
    # Saundarya
    python -m ingestion.ingest --transcription data/processed/transcription.txt \\
        --book saundarya --book-name "Saundarya" --book-slug "saundarya"

    # Mantra Rahasya (last 100 pages)
    python -m ingestion.ingest \\
        --transcription data/processed/mantra_rahasya_transcription.txt \\
        --book mantra_rahasya --book-name "Mantra Rahasya" --book-slug "mantra-rahasya"

    python -m ingestion.ingest --skip-ocr
    python -m ingestion.ingest --force
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

PDF_PATH = os.getenv("PDF_PATH", "./data/raw/saundarya.pdf")
PROCESSED_TEXT_DIR = os.getenv("PROCESSED_TEXT_DIR", "./data/processed")


# ──────────────────────────────────────────────────────────────────────────────
# Document loaders
# ──────────────────────────────────────────────────────────────────────────────

def run_ocr(pdf_path: str, output_dir: str, force: bool = False) -> None:
    # OCR is now handled by transcribe_pages.py (EasyOCR) or llamacloud_parser.py.
    # Run one of those first to generate the annotated transcription file, then
    # pass it via --transcription.
    print("[ingest] Direct OCR mode is deprecated. Use transcribe_pages.py instead:")
    print("         python -m ingestion.transcribe_pages --pdf <path> --out <output.txt>")
    raise SystemExit(1)


def load_documents_from_transcription(
    transcription_path: str,
    book: str = "saundarya",
    book_name: str = "Saundarya",
    book_slug: str = "saundarya",
    language: str = "hi",
    tags: list[str] | None = None,
):
    if book == "mantra_rahasya":
        from ingestion.load_transcription import load_mantra_rahasya_transcription
        documents = load_mantra_rahasya_transcription(transcription_path)
    elif book == "apsara_sadhna":
        from ingestion.load_transcription import load_apsara_sadhna_transcription
        documents = load_apsara_sadhna_transcription(transcription_path)
    else:
        from ingestion.load_transcription import load_saundarya_transcription
        documents = load_saundarya_transcription(transcription_path)

    for doc in documents:
        doc.metadata["book"] = book_name
        doc.metadata["book_slug"] = book_slug
        doc.metadata["language"] = language
        doc.metadata["tags"] = tags or ["spiritual", "sadhana"]
        doc.metadata["source_type"] = "book"
        doc.metadata["author"] = "Dr. Narayan Dutt Shrimali"
        doc.metadata["topic"] = _infer_topic(doc.metadata.get("chapter_title", ""))

    print(f"[ingest] Loaded {len(documents)} page documents from transcription")
    return documents


def load_documents_from_ocr(
    processed_dir: str,
    book_name: str = "Saundarya",
    book_slug: str = "saundarya",
    language: str = "hi",
    tags: list[str] | None = None,
):
    from llama_index.core import SimpleDirectoryReader

    txt_files = sorted(Path(processed_dir).glob("*.txt"))
    if not txt_files:
        print(f"[ingest] No .txt files found in {processed_dir}. Run OCR first.")
        sys.exit(1)

    print(f"[ingest] Loading {len(txt_files)} OCR text files from {processed_dir}")
    reader = SimpleDirectoryReader(input_dir=processed_dir, required_exts=[".txt"])
    documents = reader.load_data()

    for doc in documents:
        fname = Path(doc.metadata.get("file_name", "")).stem
        if fname.startswith("page_"):
            try:
                doc.metadata["page"] = int(fname.split("_")[1])
            except (IndexError, ValueError):
                pass

        doc.metadata["chapter_number"] = None
        doc.metadata["chapter_title"] = None
        doc.metadata["section_type"] = "ocr_page"
        doc.metadata["book"] = book_name
        doc.metadata["book_slug"] = book_slug
        doc.metadata["language"] = language
        doc.metadata["tags"] = tags or ["spiritual", "sadhana"]
        doc.metadata["source_type"] = "book"
        doc.metadata["author"] = "Dr. Narayan Dutt Shrimali"
        doc.metadata["topic"] = "general"

    print(f"[ingest] Loaded {len(documents)} document(s)")
    return documents


def _infer_topic(chapter_title: str) -> str:
    """Heuristically map chapter titles to spiritual topic tags."""
    title_lower = chapter_title.lower()
    if "कुंडलिनी" in title_lower or "kundalini" in title_lower:
        return "kundalini"
    if "मंत्र" in title_lower or "mantra" in title_lower:
        return "mantra"
    if "तंत्र" in title_lower or "tantra" in title_lower:
        return "tantra"
    if "साधना" in title_lower or "sadhana" in title_lower:
        return "sadhana"
    if "जयोतिष" in title_lower or "jyotish" in title_lower:
        return "jyotish"
    if "सौन्दर्य" in title_lower or "saundarya" in title_lower or "beauty" in title_lower:
        return "beauty_spirituality"
    if "कामदेव" in title_lower or "riti" in title_lower:
        return "tantra"
    if "अप्सरा" in title_lower or "apsara" in title_lower:
        return "apsara"
    if "उर्वशी" in title_lower or "नाभिदर्शना" in title_lower or "मृगाक्षी" in title_lower or "भैरवी" in title_lower:
        return "apsara"
    return "spiritual_teachings"


# ──────────────────────────────────────────────────────────────────────────────
# Chunking & indexing
# ──────────────────────────────────────────────────────────────────────────────

def chunk_documents(documents):
    from llama_index.core.node_parser import SentenceSplitter

    splitter = SentenceSplitter(chunk_size=512, chunk_overlap=64)
    nodes = splitter.get_nodes_from_documents(documents)
    print(f"[ingest] Created {len(nodes)} chunks (chunk_size=512, overlap=64)")
    return nodes


def build_index(nodes, force: bool = False):
    from llama_index.core import StorageContext, VectorStoreIndex, Settings
    from rag.embeddings import get_embedding_model
    from rag.vector_store import get_vector_store, collection_count

    embed_model = get_embedding_model()
    Settings.embed_model = embed_model
    Settings.embed_batch_size = 32
    Settings.llm = None

    existing = collection_count()
    if existing > 0 and not force:
        print(
            f"[ingest] Collection already contains {existing} vectors. "
            "Skipping re-ingestion. Use --force to override."
        )
        return

    vector_store = get_vector_store()
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    print(f"[ingest] Embedding and upserting {len(nodes)} nodes into MongoDB Atlas ...")
    VectorStoreIndex(
        nodes,
        storage_context=storage_context,
        show_progress=True,
    )
    print(f"[ingest] Done. Collection now has {collection_count()} vectors.")


# ──────────────────────────────────────────────────────────────────────────────
# Pipeline entry points
# ──────────────────────────────────────────────────────────────────────────────

def run_pipeline(
    transcription: str | None = None,
    book: str = "saundarya",
    skip_ocr: bool = False,
    force: bool = False,
    book_name: str = "Saundarya",
    book_slug: str = "saundarya",
    language: str = "hi",
    tags: list[str] | None = None,
) -> None:
    _tags = tags or ["spiritual", "sadhana"]

    if transcription:
        print(f"[ingest] Step 1/3 — Loading transcription: {transcription}  (book={book})")
        documents = load_documents_from_transcription(
            transcription, book, book_name, book_slug, language, _tags
        )
    else:
        if not skip_ocr:
            print("[ingest] Step 1/3 — Running OCR ...")
            run_ocr(pdf_path=PDF_PATH, output_dir=PROCESSED_TEXT_DIR, force=force)
        else:
            print("[ingest] Step 1/3 — OCR skipped (--skip-ocr)")
        documents = load_documents_from_ocr(
            PROCESSED_TEXT_DIR, book_name, book_slug, language, _tags
        )

    print("[ingest] Step 2/3 — Chunking documents ...")
    nodes = chunk_documents(documents)

    print("[ingest] Step 3/3 — Embedding and storing vectors ...")
    build_index(nodes, force=force)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the RAG ingestion pipeline")
    parser.add_argument("--transcription", metavar="PATH", default=None)
    parser.add_argument("--book", default="saundarya",
                        choices=["saundarya", "mantra_rahasya", "apsara_sadhna"],
                        help="Chapter map to apply (default: saundarya)")
    parser.add_argument("--skip-ocr", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--book-name", default="Saundarya", help="Human-readable book name")
    parser.add_argument("--book-slug", default="saundarya", help="URL-safe book identifier")
    parser.add_argument("--language", default="hi", help="ISO 639-1 language code (hi/en)")
    parser.add_argument(
        "--tags",
        default="spiritual,sadhana",
        help="Comma-separated topic tags",
    )
    args = parser.parse_args()

    run_pipeline(
        transcription=args.transcription,
        book=args.book,
        skip_ocr=args.skip_ocr,
        force=args.force,
        book_name=args.book_name,
        book_slug=args.book_slug,
        language=args.language,
        tags=[t.strip() for t in args.tags.split(",")],
    )


if __name__ == "__main__":
    main()
