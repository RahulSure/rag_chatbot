"""
OCR quality test for Mantra Rahasya (384 pages).

Runs OCR on a small strategic sample, scores each page, and prints a
quality report so you can decide whether to proceed with full ingestion.

Usage:
    # Claude Vision (best quality, recommended)
    python -m ingestion.ocr_test --engine claude

    # EasyOCR (no API cost, slower, lower quality)
    python -m ingestion.ocr_test --engine easyocr

    # Custom pages / DPI
    python -m ingestion.ocr_test --engine claude --pages 1,5,10,50,100,200,300,380
    python -m ingestion.ocr_test --engine easyocr --dpi 400
"""

from __future__ import annotations

import argparse
import re
import unicodedata
from pathlib import Path

# ── defaults ──────────────────────────────────────────────────────────────────
DEFAULT_PDF    = "data/raw/Mantra Rahasya.pdf"
DEFAULT_PAGES  = [1, 5, 10, 50, 100, 150, 250, 380]   # spread across 384 pages
DEFAULT_DPI    = 300
DEFAULT_OUT    = "data/processed/ocr_test"

# Devanagari unicode block: U+0900 – U+097F
_DEVANAGARI = re.compile(r"[ऀ-ॿ]")

# Characters that typically signal OCR garbage in Hindi scans
_GARBAGE     = re.compile(r"[|}{\\<>~`@#$%^&*_=+\[\]]")


# ── scoring ───────────────────────────────────────────────────────────────────

def score_page(text: str) -> dict:
    """
    Returns a quality dict for one OCR'd page.

    Metrics
    -------
    hindi_ratio     : fraction of non-space chars that are Devanagari (0–1)
    lines           : non-empty line count
    char_count      : total character count
    garbage_ratio   : fraction of chars that are garbage symbols (0–1)
    grade           : A / B / C / F
    notes           : list of warning strings
    """
    non_space = text.replace(" ", "").replace("\n", "")
    total     = len(non_space) or 1

    hindi_chars   = len(_DEVANAGARI.findall(text))
    garbage_chars = len(_GARBAGE.findall(text))
    lines         = len([l for l in text.splitlines() if l.strip()])

    hindi_ratio   = hindi_chars / total
    garbage_ratio = garbage_chars / total

    notes: list[str] = []

    if len(non_space) < 100:
        notes.append("very short — image may be blank or decorative")
    if hindi_ratio < 0.30:
        notes.append(f"low Hindi ratio ({hindi_ratio:.0%}) — OCR may not recognise script")
    if garbage_ratio > 0.05:
        notes.append(f"high garbage ratio ({garbage_ratio:.0%}) — noisy scan or wrong language pack")
    if lines < 5:
        notes.append(f"only {lines} lines — page may be mostly image/diagram")

    if hindi_ratio >= 0.55 and garbage_ratio <= 0.02 and lines >= 8:
        grade = "A"
    elif hindi_ratio >= 0.40 and garbage_ratio <= 0.05 and lines >= 5:
        grade = "B"
    elif hindi_ratio >= 0.20 or lines >= 3:
        grade = "C"
    else:
        grade = "F"

    return {
        "hindi_ratio":   round(hindi_ratio, 3),
        "lines":         lines,
        "char_count":    len(non_space),
        "garbage_ratio": round(garbage_ratio, 3),
        "grade":         grade,
        "notes":         notes,
    }


# ── OCR one page ──────────────────────────────────────────────────────────────

_easyocr_reader = None

def _get_easyocr_reader():
    """Returns a cached EasyOCR reader (loads models only once per process)."""
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr
        print("\n[ocr_test] Loading EasyOCR models (downloads ~1.5 GB on first run) ...")
        _easyocr_reader = easyocr.Reader(["hi", "en"], gpu=False)
    return _easyocr_reader


def _render_page_png_b64(pdf_path: str, page_number: int, dpi: int) -> str:
    """Render a PDF page and return a base64-encoded PNG string."""
    import base64
    import fitz

    doc = fitz.open(pdf_path)
    page = doc[page_number - 1]
    zoom = dpi / 72
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    png_bytes = pix.tobytes("png")
    doc.close()
    return base64.standard_b64encode(png_bytes).decode()


def ocr_single_page_easyocr(pdf_path: str, page_number: int, dpi: int) -> str:
    import fitz
    import numpy as np

    doc = fitz.open(pdf_path)
    page = doc[page_number - 1]
    pix = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72), alpha=False)
    img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    doc.close()

    reader = _get_easyocr_reader()
    results = reader.readtext(img_array, detail=0, paragraph=True)
    return "\n".join(results)


def ocr_single_page_claude(pdf_path: str, page_number: int, dpi: int) -> str:
    import anthropic

    img_b64 = _render_page_png_b64(pdf_path, page_number, dpi)

    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": img_b64,
                    },
                },
                {
                    "type": "text",
                    "text": (
                        "This is a page from a Hindi spiritual book. "
                        "Transcribe ALL text exactly as written, preserving "
                        "line breaks and paragraph structure. "
                        "Output only the transcribed text, nothing else."
                    ),
                },
            ],
        }],
    )
    return response.content[0].text


def ocr_single_page(pdf_path: str, page_number: int, dpi: int, engine: str = "claude") -> str:
    if engine == "claude":
        return ocr_single_page_claude(pdf_path, page_number, dpi)
    return ocr_single_page_easyocr(pdf_path, page_number, dpi)


# ── report ────────────────────────────────────────────────────────────────────

_GRADE_LABEL = {"A": "Excellent", "B": "Good", "C": "Acceptable", "F": "Poor"}
_GRADE_COLOR = {"A": "✅", "B": "🟡", "C": "🟠", "F": "❌"}


def print_report(results: list[dict], out_dir: Path) -> None:
    sep  = "─" * 72
    dsep = "═" * 72

    print(f"\n{dsep}")
    print(f"  OCR QUALITY REPORT — Mantra Rahasya")
    print(f"  Sample: {len(results)} pages   Output dir: {out_dir}")
    print(f"{dsep}\n")

    grades = [r["score"]["grade"] for r in results]

    for r in results:
        s = r["score"]
        print(f"{sep}")
        print(
            f"  Page {r['page']:>4}  |  Grade {_GRADE_COLOR[s['grade']]} {s['grade']} "
            f"({_GRADE_LABEL[s['grade']]})  |  "
            f"Hindi {s['hindi_ratio']:.0%}  |  "
            f"Lines {s['lines']}  |  "
            f"Chars {s['char_count']}"
        )
        if s["notes"]:
            for note in s["notes"]:
                print(f"           ⚠  {note}")
        print()

        # show first 400 chars of OCR text
        snippet = r["text"][:400].strip()
        for line in snippet.splitlines():
            if line.strip():
                print(f"    {line}")
        if len(r["text"]) > 400:
            print("    […truncated — full text saved to file]")
        print()

    # summary
    print(f"{dsep}")
    a = grades.count("A")
    b = grades.count("B")
    c = grades.count("C")
    f = grades.count("F")
    total = len(grades)
    good  = a + b

    print(f"  SUMMARY  →  A:{a}  B:{b}  C:{c}  F:{f}  out of {total} pages")
    print()

    if good / total >= 0.75:
        print("  ✅ RECOMMENDATION: Quality is good — safe to run full ingestion.")
        print("     Run:  python -m ingestion.ingest --skip-ocr  (if pages already saved)")
        print("       or:  python -m ingestion.ingest  (full OCR)")
    elif good / total >= 0.50:
        print("  🟡 RECOMMENDATION: Mixed quality.")
        print("     Consider trying --dpi 400 on problem pages, or reviewing C/F pages manually.")
    else:
        print("  ❌ RECOMMENDATION: Quality is poor.")
        print("     Try Claude Vision (best quality for Hindi):")
        print("     python -m ingestion.ocr_test --engine claude")

    print(f"{dsep}\n")


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Test OCR quality on a sample of pages")
    parser.add_argument("--pdf",    default=DEFAULT_PDF)
    parser.add_argument("--pages",  default=",".join(map(str, DEFAULT_PAGES)),
                        help="Comma-separated page numbers to sample")
    parser.add_argument("--dpi",    type=int, default=DEFAULT_DPI)
    parser.add_argument("--out",    default=DEFAULT_OUT,
                        help="Directory to save per-page OCR text files")
    parser.add_argument("--engine", default="claude", choices=["claude", "easyocr"],
                        help="OCR engine: claude (best quality) or easyocr (no API cost)")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"[ocr_test] PDF not found: {pdf_path}")
        return

    pages   = [int(p.strip()) for p in args.pages.split(",")]
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[ocr_test] Engine: {args.engine}  DPI: {args.dpi}  Pages: {pages}")

    results: list[dict] = []

    for page_num in pages:
        print(f"[ocr_test] page {page_num} ...", end=" ", flush=True)
        text = ocr_single_page(str(pdf_path), page_num, args.dpi, engine=args.engine)
        score = score_page(text)

        out_file = out_dir / f"page_{page_num:03d}.txt"
        out_file.write_text(text, encoding="utf-8")

        results.append({"page": page_num, "text": text, "score": score})
        print(f"grade={score['grade']}  hindi={score['hindi_ratio']:.0%}  lines={score['lines']}")

    print_report(results, out_dir)


if __name__ == "__main__":
    main()
