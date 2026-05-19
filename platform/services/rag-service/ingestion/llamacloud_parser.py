"""
LlamaCloud document parser for scanned Hindi PDFs.

Uploads the PDF to LlamaCloud, parses it with Hindi OCR, and saves
the result (per-page text + full text) to data/processed/.

Usage:
    python -m ingestion.llamacloud_parser
    python -m ingestion.llamacloud_parser --pdf "data/raw/Mantra Rahasya.pdf"
    python -m ingestion.llamacloud_parser --tier cost_effective
"""

from __future__ import annotations

import argparse
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY", "")
PROCESSED_TEXT_DIR  = os.getenv("PROCESSED_TEXT_DIR", "./data/processed")


# ── core parser ───────────────────────────────────────────────────────────────

async def _parse(pdf_path: str, tier: str) -> object:
    from llama_cloud import AsyncLlamaCloud

    if not LLAMA_CLOUD_API_KEY:
        raise ValueError("LLAMA_CLOUD_API_KEY is not set in .env")

    client = AsyncLlamaCloud(api_key=LLAMA_CLOUD_API_KEY)

    print(f"[llamacloud] Uploading {pdf_path} ...")
    file_obj = await client.files.create(file=pdf_path, purpose="parse")
    print(f"[llamacloud] File uploaded. id={file_obj.id}")

    print(f"[llamacloud] Parsing (tier={tier}, lang=hi) — this may take a few minutes ...")
    result = await client.parsing.parse(
        file_id=file_obj.id,
        tier=tier,
        version="latest",
        processing_options={
            "ocr_parameters": {
                "languages": ["hi"]
            }
        },
        expand=["markdown_full", "text_full", "text", "markdown"],
    )
    print("[llamacloud] Parsing complete.")
    return result


def parse_pdf(pdf_path: str, tier: str = "agentic") -> object:
    """Synchronous wrapper — returns the raw LlamaCloud result object."""
    return asyncio.run(_parse(pdf_path, tier))


# ── save results ──────────────────────────────────────────────────────────────

def save_results(result: object, out_dir: str) -> None:
    """
    Saves parsed output to *out_dir*:
      - transcription.txt       full document text
      - transcription.md        full document markdown
      - page_001.txt … page_NNN.txt   per-page text (if available)
    """
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # Full document text
    if getattr(result, "text_full", None):
        dest = out_path / "transcription.txt"
        dest.write_text(result.text_full, encoding="utf-8")
        print(f"[llamacloud] Saved full text  → {dest}")

    # Full document markdown
    if getattr(result, "markdown_full", None):
        dest = out_path / "transcription.md"
        dest.write_text(result.markdown_full, encoding="utf-8")
        print(f"[llamacloud] Saved full markdown → {dest}")

    # Per-page text files
    pages = getattr(result, "text", None)
    if pages:
        for i, page_text in enumerate(pages, start=1):
            dest = out_path / f"page_{i:03d}.txt"
            content = page_text if isinstance(page_text, str) else getattr(page_text, "text", str(page_text))
            dest.write_text(content, encoding="utf-8")
        print(f"[llamacloud] Saved {len(pages)} per-page files → {out_path}/page_NNN.txt")


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Parse a Hindi PDF using LlamaCloud")
    parser.add_argument(
        "--pdf",
        default=os.getenv("PDF_PATH", "./data/raw/Mantra Rahasya.pdf"),
        help="Path to the source PDF",
    )
    parser.add_argument(
        "--out",
        default=PROCESSED_TEXT_DIR,
        help="Output directory for parsed text files",
    )
    parser.add_argument(
        "--tier",
        default="agentic",
        choices=["fast", "cost_effective", "agentic", "agentic_plus"],
        help="LlamaCloud parsing tier (default: agentic)",
    )
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"[llamacloud] PDF not found: {pdf_path}")
        return

    result = parse_pdf(str(pdf_path), tier=args.tier)
    save_results(result, args.out)

    print("\n--- Preview (first 500 chars of text_full) ---")
    if getattr(result, "text_full", None):
        print(result.text_full[:500])


if __name__ == "__main__":
    main()
