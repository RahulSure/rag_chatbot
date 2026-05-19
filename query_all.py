"""
Sends a batch of questions to the RAG API and saves answers to answers.txt.

Usage:
    python query_all.py
    python query_all.py --url http://localhost:8000 --out answers.txt --top-k 5
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import requests

QUESTIONS = [
    "कायाकल्प क्या है? और यह कैसे संभव है?",
    "आज्ञा चक्र और रंगीन बिंदी का सौन्दर्य से क्या संबंध है?",
    "कामदेव रति साधना क्या है?",
    "कामदेव रति साधना कैसे की जाए?",
    "सौन्दर्य के लिए कौन सी साधना उत्तम है?",
]


def query(base_url: str, question: str, top_k: int) -> dict:
    response = requests.post(
        f"{base_url}/query",
        json={"question": question, "top_k": top_k},
        timeout=120,
    )
    response.raise_for_status()
    return response.json()


def format_entry(index: int, question: str, data: dict) -> str:
    sources = data.get("sources", [])
    source_lines = "\n".join(
        f"    • पृष्ठ {s.get('page', '?')}: {s.get('text_snippet', '')[:120]}..."
        for s in sources
    )
    return (
        f"{'═' * 70}\n"
        f"प्रश्न {index}: {question}\n"
        f"{'─' * 70}\n"
        f"उत्तर:\n{data.get('answer', '').strip()}\n"
        f"{'─' * 70}\n"
        f"स्रोत:\n{source_lines}\n"
        f"मॉडल: {data.get('model', '')}\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000")
    parser.add_argument("--out", default="answers.txt")
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    out_path = Path(args.out)
    lines: list[str] = [
        f"सौन्दर्य RAG — प्रश्नोत्तर संग्रह\n"
        f"दिनांक: {datetime.now().strftime('%d-%m-%Y %H:%M:%S')}\n"
        f"सर्वर: {args.url}\n"
        f"{'═' * 70}\n"
    ]

    for i, question in enumerate(QUESTIONS, start=1):
        print(f"[{i}/{len(QUESTIONS)}] {question}")
        try:
            data = query(args.url, question, args.top_k)
            lines.append(format_entry(i, question, data))
            print(f"       ✓ answered ({len(data.get('answer',''))} chars)\n")
        except requests.RequestException as exc:
            error_block = (
                f"{'═' * 70}\n"
                f"प्रश्न {i}: {question}\n"
                f"{'─' * 70}\n"
                f"त्रुटि: {exc}\n"
            )
            lines.append(error_block)
            print(f"       ✗ failed: {exc}\n")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"✓ Saved to {out_path.resolve()}")


if __name__ == "__main__":
    main()
