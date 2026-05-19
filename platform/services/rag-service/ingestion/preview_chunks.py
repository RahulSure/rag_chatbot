"""
Preview the exact text snippets that will be embedded during ingestion.

Runs OCR on a configurable page range and applies the same SentenceSplitter
settings (chunk_size=512, overlap=64) used by ingest.py — so what you see
here is exactly what goes into ChromaDB.

Usage
-----
    # Preview chunks from pages 1-5 (default)
    python -m ingestion.preview_chunks

    # Pages 3 to 8, show full text (no truncation)
    python -m ingestion.preview_chunks --pages 3-8 --full

    # Use already-OCR'd .txt files (skip re-OCR)
    python -m ingestion.preview_chunks --skip-ocr --pages 1-5

    # Save preview to a file
    python -m ingestion.preview_chunks --pages 1-10 --out preview.txt
"""

from __future__ import annotations

import argparse
import os
import sys
import textwrap
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# ── defaults from .env ────────────────────────────────────────────────────────
PDF_PATH = os.getenv("PDF_PATH", "./data/raw/saundarya.pdf")
PROCESSED_TEXT_DIR = os.getenv("PROCESSED_TEXT_DIR", "./data/processed")
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
SNIPPET_WIDTH = 120  # chars per line when wrapping preview output


# ── helpers ───────────────────────────────────────────────────────────────────

def _check_deps() -> None:
    missing = []
    try:
        import pdf2image  # noqa: F401
    except ImportError:
        missing.append("pdf2image")
    try:
        import pytesseract  # noqa: F401
    except ImportError:
        missing.append("pytesseract")
    try:
        import PIL  # noqa: F401
    except ImportError:
        missing.append("Pillow")

    if missing:
        print("[preview] Missing Python packages:", ", ".join(missing))
        print("  Install with: pip install", " ".join(missing))
        sys.exit(1)


def _ocr_pages(pdf_path: str, page_range: range, output_dir: str) -> list[Path]:
    """OCR only the requested pages; skip pages that already have a .txt file."""
    from ingestion.ocr_extractor import extract_text_from_pdf

    # We always OCR the full PDF but only into the standard processed/ dir.
    # For preview we just call the same extractor — it skips existing pages.
    all_paths = extract_text_from_pdf(
        pdf_path=pdf_path,
        output_dir=output_dir,
        lang="hin+eng",
        dpi=300,
        force=False,
    )
    # Filter to only the requested page range (1-indexed)
    wanted = {f"page_{p:03d}.txt" for p in page_range}
    return sorted(p for p in all_paths if p.name in wanted)


def _load_txt_files(output_dir: str, page_range: range) -> list[Path]:
    """Return .txt files for the requested page range (must already exist)."""
    wanted = {f"page_{p:03d}.txt" for p in page_range}
    found = []
    for name in wanted:
        p = Path(output_dir) / name
        if p.exists():
            found.append(p)
        else:
            print(f"[preview] WARNING: {p} not found — run without --skip-ocr first")
    return sorted(found)


def _chunk_text_files(txt_files: list[Path]) -> list[dict]:
    """
    Apply the same SentenceSplitter used in ingest.py and return a list of
    chunk dicts: {chunk_id, page, char_count, text}
    """
    from llama_index.core import Document
    from llama_index.core.node_parser import SentenceSplitter

    documents = []
    for txt_file in txt_files:
        text = txt_file.read_text(encoding="utf-8").strip()
        if not text:
            print(f"[preview] WARNING: {txt_file.name} is empty — OCR may have produced no output")
            continue
        page_num = int(txt_file.stem.split("_")[1])
        doc = Document(text=text, metadata={"page": page_num, "source": txt_file.name})
        documents.append(doc)

    if not documents:
        print("[preview] No non-empty documents to chunk.")
        return []

    splitter = SentenceSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    nodes = splitter.get_nodes_from_documents(documents)

    chunks = []
    for i, node in enumerate(nodes, start=1):
        chunks.append(
            {
                "chunk_id": i,
                "page": node.metadata.get("page", "?"),
                "char_count": len(node.text),
                "text": node.text,
            }
        )
    return chunks


def _print_preview(chunks: list[dict], full: bool, out_file=None) -> None:
    def _write(line: str) -> None:
        print(line)
        if out_file:
            out_file.write(line + "\n")

    separator = "─" * 80
    _write(f"\n{'═' * 80}")
    _write(f"  CHUNK PREVIEW  ({len(chunks)} chunks total)")
    _write(f"  chunk_size={CHUNK_SIZE}  overlap={CHUNK_OVERLAP}")
    _write(f"{'═' * 80}\n")

    for chunk in chunks:
        _write(separator)
        _write(
            f"  Chunk #{chunk['chunk_id']:>3}  |  Page {chunk['page']}  "
            f"|  {chunk['char_count']} chars"
        )
        _write(separator)
        text = chunk["text"]
        if not full and len(text) > 400:
            display = text[:400].rstrip() + "  [… truncated, use --full to see all]"
        else:
            display = text
        # Wrap long lines for readability
        for para in display.split("\n"):
            if para.strip():
                for line in textwrap.wrap(para, width=SNIPPET_WIDTH):
                    _write("  " + line)
            else:
                _write("")
        _write("")

    _write(f"\n{'═' * 80}")
    _write(f"  Total chunks to be embedded: {len(chunks)}")
    _write(f"{'═' * 80}\n")


def _parse_page_range(s: str, total_pages: int | None = None) -> range:
    """Parse '3-8' or '5' into a range. Clamps to total_pages if known."""
    s = s.strip()
    if "-" in s:
        parts = s.split("-", 1)
        start, end = int(parts[0]), int(parts[1])
    else:
        start = end = int(s)
    if total_pages:
        end = min(end, total_pages)
    return range(start, end + 1)


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Preview OCR text and chunks before ingestion"
    )
    parser.add_argument(
        "--pages",
        default="1-5",
        help="Page range to preview, e.g. '1-5' or '3' (default: 1-5)",
    )
    parser.add_argument(
        "--skip-ocr",
        action="store_true",
        help="Use existing .txt files in data/processed/ instead of re-running OCR",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Show complete chunk text (default: truncate at 400 chars)",
    )
    parser.add_argument(
        "--pdf",
        default=PDF_PATH,
        help=f"Path to source PDF (default: {PDF_PATH})",
    )
    parser.add_argument(
        "--processed-dir",
        default=PROCESSED_TEXT_DIR,
        help=f"Directory with OCR .txt files (default: {PROCESSED_TEXT_DIR})",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Save preview output to this file (also prints to console)",
    )
    args = parser.parse_args()

    _check_deps()

    page_range = _parse_page_range(args.pages)
    print(f"[preview] Page range: {page_range.start}–{page_range.stop - 1}")

    if args.skip_ocr:
        print("[preview] Using existing OCR files (--skip-ocr)")
        txt_files = _load_txt_files(args.processed_dir, page_range)
    else:
        print(f"[preview] Running OCR on pages {page_range.start}–{page_range.stop - 1} ...")
        txt_files = _ocr_pages(args.pdf, page_range, args.processed_dir)

    if not txt_files:
        print("[preview] No text files available. Exiting.")
        sys.exit(1)

    print(f"[preview] Chunking {len(txt_files)} page(s) ...")
    chunks = _chunk_text_files(txt_files)

    out_file = None
    if args.out:
        out_path = Path(args.out)
        out_file = out_path.open("w", encoding="utf-8")
        print(f"[preview] Saving preview to {out_path}")

    try:
        _print_preview(chunks, full=args.full, out_file=out_file)
    finally:
        if out_file:
            out_file.close()
            print(f"[preview] Saved to {args.out}")


if __name__ == "__main__":
    main()
