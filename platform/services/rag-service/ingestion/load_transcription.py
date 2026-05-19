"""
Loaders for hand-transcribed / OCR-generated single-file transcripts.

Parses page boundaries, strips layout annotations, and attaches enriched
metadata (chapter number, chapter title, section type) to each Document.

Supported books
---------------
- Saundarya (सौन्दर्य)  — load_saundarya_transcription()
- Mantra Rahasya         — load_mantra_rahasya_transcription()

Both functions share the same underlying parser via load_transcription().
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

_PAGE_MARKER = re.compile(r"---\s*पृष्ठ\s+(\d+)[^-]*---")
_ANNOTATION  = re.compile(r"\[[^\]]{1,80}\]")   # strip [बायीं ओर], [image …]


# ── Saundarya chapter map (from book ToC, page 3) ─────────────────────────────

_SAUNDARYA_CHAPTERS: dict[int, tuple[int, str]] = {
    6:  (1, "सौन्दर्य आधार है संसार का"),
    14: (2, "हाँ! हम चिरयुवा बने रह सकते हैं"),
    23: (3, "सौन्दर्यवती बनना भी ईश्वर की आराधना है"),
    33: (4, "तिय मुख पर बेंदी लगे रूप सौ गणो होय"),
    43: (5, "कामदेव रति साधना"),
}

# ── Mantra Rahasya chapter map (pages 285–384, last 100 pages) ────────────────
# Update page boundaries after reading the transcription if chapters are known.

_MANTRA_RAHASYA_CHAPTERS: dict[int, tuple[int, str]] = {
    285: (1, "मन्त्र रहस्य — उत्तरार्ध"),
}


# ── helpers ───────────────────────────────────────────────────────────────────

def _chapter_for_page(
    page: int,
    chapter_map: dict[int, tuple[int, str]],
) -> tuple[int, str]:
    num, title = 0, "Front Matter"
    for start in sorted(chapter_map):
        if page >= start:
            num, title = chapter_map[start]
    return num, title


def _clean(text: str) -> str:
    text = _ANNOTATION.sub("", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ── core parser ───────────────────────────────────────────────────────────────

def load_transcription(
    path: str | Path,
    chapter_map: dict[int, tuple[int, str]],
    source_name: Optional[str] = None,
    skip_front_matter: bool = True,
) -> list:
    """
    Parse *path* into LlamaIndex Documents, one per book page.

    Parameters
    ----------
    path          : Path to the annotated transcription file.
    chapter_map   : Dict mapping first-page-of-chapter → (chapter_number, title).
    source_name   : Value stored in metadata["source"]. Defaults to filename.
    skip_front_matter : Skip pages where chapter_number == 0 (front matter).

    Returns
    -------
    list[llama_index.core.Document]  — metadata keys:
        page, chapter_number, chapter_title, section_type, source
    """
    from llama_index.core import Document

    path      = Path(path)
    raw       = path.read_text(encoding="utf-8")
    src_label = source_name or path.name
    parts     = _PAGE_MARKER.split(raw)

    documents: list[Document] = []

    for i in range(1, len(parts) - 1, 2):
        page_num  = int(parts[i])
        page_body = parts[i + 1]

        chapter_num, chapter_title = _chapter_for_page(page_num, chapter_map)

        if skip_front_matter and chapter_num == 0:
            continue

        cleaned = _clean(page_body)
        if not cleaned:
            continue

        documents.append(
            Document(
                text=cleaned,
                metadata={
                    "page":          page_num,
                    "chapter_number": chapter_num,
                    "chapter_title":  chapter_title,
                    "section_type":   "chapter",
                    "source":         src_label,
                },
            )
        )

    print(
        f"[transcription] {src_label}: loaded {len(documents)} pages "
        f"({'front matter skipped' if skip_front_matter else 'including front matter'})"
    )
    return documents


# ── book-specific convenience wrappers ────────────────────────────────────────

def load_saundarya_transcription(path: str | Path) -> list:
    """Load Saundarya (सौन्दर्य) transcription with chapter metadata."""
    return load_transcription(
        path=path,
        chapter_map=_SAUNDARYA_CHAPTERS,
        source_name="saundarya.txt",
        skip_front_matter=True,
    )


def load_mantra_rahasya_transcription(path: str | Path) -> list:
    """Load Mantra Rahasya transcription (pages 285–384) with chapter metadata."""
    return load_transcription(
        path=path,
        chapter_map=_MANTRA_RAHASYA_CHAPTERS,
        source_name="mantra_rahasya.txt",
        skip_front_matter=False,   # all pages are main content
    )
