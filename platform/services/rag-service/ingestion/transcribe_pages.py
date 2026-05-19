"""
Batch-transcribe a page range from any PDF using EasyOCR.

Renders each page with PyMuPDF and runs EasyOCR (Hindi + English),
then writes an annotated transcription file in the format expected by
load_transcription.py:

    --- पृष्ठ N ---
    <page text>

Usage:
    # Last 100 pages of Mantra Rahasya (default)
    python -m ingestion.transcribe_pages

    # Custom range / output path
    python -m ingestion.transcribe_pages --start 1 --end 50 \\
        --pdf "data/raw/Mantra Rahasya.pdf" \\
        --out data/processed/mantra_rahasya_transcription.txt

    # Higher DPI for better quality
    python -m ingestion.transcribe_pages --dpi 400

    # Resume a partial run (skips pages already in the output file)
    python -m ingestion.transcribe_pages --resume
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

DEFAULT_PDF   = "/Users/ananyaroy/sayantan/rag_chatbot/data/raw/Mantra Rahasya.pdf"
DEFAULT_START = 285
DEFAULT_END   = 384
DEFAULT_DPI   = 400
DEFAULT_OUT   = "data/processed/mantra_rahasya_transcription.txt"

_PAGE_MARKER = re.compile(r"---\s*पृष्ठ\s+(\d+)[^-]*---")

_reader = None


def _get_reader():
    global _reader
    if _reader is None:
        import easyocr
        print("[transcribe] Loading EasyOCR models (first run downloads ~1.5 GB) ...")
        _reader = easyocr.Reader(["hi", "en"], gpu=False)
    return _reader


def ocr_page(pdf_path: str, page_number: int, dpi: int) -> str:
    import fitz
    import numpy as np

    doc  = fitz.open(pdf_path)
    page = doc[page_number - 1]
    pix  = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72), alpha=False)
    img  = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    doc.close()

    reader  = _get_reader()
    results = reader.readtext(img, detail=0, paragraph=True)
    return "\n".join(results)


def _existing_pages(out_path: Path) -> set[int]:
    if not out_path.exists():
        return set()
    return {int(m) for m in _PAGE_MARKER.findall(out_path.read_text(encoding="utf-8"))}


def transcribe_range(
    pdf_path: str,
    start: int,
    end: int,
    dpi: int,
    out_path: str,
    resume: bool = False,
) -> None:
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    done   = _existing_pages(out) if resume else set()
    total  = end - start + 1

    if done:
        print(f"[transcribe] Resume: {len(done)} pages already done, skipping them.")

    mode = "a" if (resume and out.exists()) else "w"
    with open(out, mode, encoding="utf-8") as fh:
        for page_num in range(start, end + 1):
            if page_num in done:
                continue

            idx = page_num - start + 1
            print(f"[transcribe] Page {page_num} ({idx}/{total}) ...", end=" ", flush=True)

            try:
                text = ocr_page(pdf_path, page_num, dpi)
            except Exception as exc:
                print(f"ERROR — {exc}")
                text = f"[OCR failed: {exc}]"

            char_count = len(text.replace(" ", "").replace("\n", ""))
            print(f"chars={char_count}")

            fh.write(f"--- पृष्ठ {page_num} ---\n")
            fh.write(text.strip())
            fh.write("\n\n")
            fh.flush()

    print(f"\n[transcribe] Saved → {out}")


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Batch EasyOCR transcription for a PDF page range"
    )
    ap.add_argument("--pdf",    default=DEFAULT_PDF)
    ap.add_argument("--start",  type=int, default=DEFAULT_START)
    ap.add_argument("--end",    type=int, default=DEFAULT_END)
    ap.add_argument("--dpi",    type=int, default=DEFAULT_DPI)
    ap.add_argument("--out",    default=DEFAULT_OUT)
    ap.add_argument("--resume", action="store_true",
                    help="Append to existing file, skipping already-done pages")
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"[transcribe] PDF not found: {pdf_path}")
        return

    total = args.end - args.start + 1
    print(f"[transcribe] PDF    : {pdf_path}")
    print(f"[transcribe] Pages  : {args.start}–{args.end}  ({total} pages)")
    print(f"[transcribe] DPI    : {args.dpi}")
    print(f"[transcribe] Output : {args.out}")
    print()

    transcribe_range(
        pdf_path=str(pdf_path),
        start=args.start,
        end=args.end,
        dpi=args.dpi,
        out_path=args.out,
        resume=args.resume,
    )


if __name__ == "__main__":
    main()
