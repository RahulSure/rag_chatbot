"""
AI Article Generator — retrieves context from RAG then generates long-form SEO articles
using Krutrim LLM. Can run sync (for direct API calls) or async via Celery.
"""

from __future__ import annotations

import json
import os
import re
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

# Ensure rag-service and packages are importable
_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_ROOT / "services" / "rag-service"))
sys.path.insert(0, str(_ROOT / "packages"))

from dotenv import load_dotenv

load_dotenv()

TOPIC_KEYWORD_MAP: dict[str, list[str]] = {
    "tantra": ["tantra sadhana", "tantric practices", "tantric knowledge", "tantra vidya"],
    "mantra": ["mantra siddhi", "mantra chanting", "mantra jaap", "powerful mantras"],
    "kundalini": ["kundalini awakening", "kundalini shakti", "kundalini yoga", "shakti rising"],
    "sadhana": ["spiritual sadhana", "sadhana practice", "spiritual discipline"],
    "jyotish": ["vedic astrology", "jyotish shastra", "horoscope", "kundali"],
    "yantra": ["yantra meditation", "sacred geometry", "yantra worship"],
    "meditation": ["meditation techniques", "dhyan", "deep meditation"],
    "beauty_spirituality": ["spiritual beauty", "saundarya sadhana", "divine beauty"],
    "guru_teachings": ["guru upadesh", "sadgurudev teachings", "shrimali ji"],
    "siddhashram": ["siddhashram mystery", "himalayan masters", "siddha yogis"],
}


def _retrieve_context(topic: str, book_slugs: list[str], top_k: int = 8) -> tuple[str, list[str]]:
    """Retrieve relevant chunks from vector store for the given topic."""
    try:
        from rag.embeddings import get_embedding_model
        from rag.vector_store import get_vector_store
        from llama_index.core import VectorStoreIndex, StorageContext, Settings
        from llama_index.core.retrievers import VectorIndexRetriever

        embed_model = get_embedding_model()
        Settings.embed_model = embed_model
        Settings.llm = None

        vector_store = get_vector_store()
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        index = VectorStoreIndex.from_vector_store(vector_store, storage_context=storage_context)
        retriever = VectorIndexRetriever(index=index, similarity_top_k=top_k)

        nodes = retriever.retrieve(topic)
        chunks = []
        books_used = set()
        for node in nodes:
            meta = node.metadata or {}
            book = meta.get("book", "Saundarya")
            page = meta.get("page", "")
            text = node.text or ""
            chunks.append(f"[Source: {book}, Page {page}]\n{text}")
            books_used.add(book)

        return "\n\n---\n\n".join(chunks), list(books_used)

    except Exception as e:
        return f"[Context retrieval failed: {e}]", ["Saundarya"]


def _call_krutrim(prompt: str) -> str:
    """Call Krutrim LLM directly for article generation."""
    import requests

    api_key = os.getenv("KRUTRIM_API_KEY", "")
    model = os.getenv("KRUTRIM_MODEL", "gpt-oss-120b")

    if not api_key:
        raise ValueError("KRUTRIM_API_KEY not set")

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.75,
        "max_tokens": 3000,
        "stream": False,
    }
    resp = requests.post(
        "https://cloud.olakrutrim.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=180,
    )
    resp.raise_for_status()
    data = resp.json()
    choices = data.get("choices", [])
    if not choices:
        return ""
    content = choices[0].get("message", {}).get("content", "")
    return content if isinstance(content, str) else str(content)


def _parse_article_json(raw: str) -> dict[str, Any]:
    """Extract JSON from LLM response (handles markdown code blocks)."""
    raw = raw.strip()
    json_match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if json_match:
        raw = json_match.group(1)
    else:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            raw = raw[start:end]
    return json.loads(raw)


def generate_article_sync(
    topic: str,
    primary_keyword: str,
    book_slugs: list[str] | None = None,
    language: str = "en",
) -> dict[str, Any]:
    """
    Generate an article synchronously. Returns the saved article document dict.
    Used when Celery is not available (direct API call).
    """
    from packages.prompts.article_prompt import ARTICLE_GENERATION_PROMPT
    from apps.api.deps import get_db

    context, books_used = _retrieve_context(topic, book_slugs or [], top_k=8)
    related_keywords = ", ".join(TOPIC_KEYWORD_MAP.get(topic, [primary_keyword]))
    book_name = books_used[0] if books_used else "Saundarya"

    prompt = ARTICLE_GENERATION_PROMPT.format(
        topic=topic,
        primary_keyword=primary_keyword,
        context=context,
        related_keywords=related_keywords,
        book_name=book_name,
    )

    raw_response = _call_krutrim(prompt)

    try:
        parsed = _parse_article_json(raw_response)
    except (json.JSONDecodeError, ValueError):
        parsed = {
            "title": f"{topic.replace('_', ' ').title()} — Teachings of Dr. Narayan Dutt Shrimali",
            "slug": f"{topic.replace('_', '-')}-shrimali-teachings-{uuid.uuid4().hex[:6]}",
            "meta_description": f"Discover the spiritual wisdom of {topic} as taught by Dr. Narayan Dutt Shrimali.",
            "body_mdx": raw_response,
            "faq": [],
            "tags": [topic, "shrimali", "spiritual"],
            "estimated_read_time_minutes": 6,
        }

    now = datetime.utcnow()
    doc = {
        "slug": parsed.get("slug", f"{topic}-{uuid.uuid4().hex[:6]}"),
        "title": parsed.get("title", topic),
        "meta_description": parsed.get("meta_description", ""),
        "body_mdx": parsed.get("body_mdx", raw_response),
        "faq": parsed.get("faq", []),
        "tags": parsed.get("tags", [topic]),
        "topic": topic,
        "source_books": books_used,
        "status": "draft",
        "created_at": now,
        "published_at": None,
        "language": language,
        "primary_keyword": primary_keyword,
        "estimated_read_time_minutes": parsed.get("estimated_read_time_minutes", 6),
    }

    try:
        db = get_db()
        result = db["articles"].insert_one(doc)
        doc["id"] = str(result.inserted_id)
    except Exception as e:
        doc["id"] = str(uuid.uuid4())

    return doc


def discover_topics(existing_topics: list[str], book_themes: list[str]) -> list[dict]:
    """Use LLM to discover new article topics for SEO coverage."""
    from packages.prompts.article_prompt import TOPIC_DISCOVERY_PROMPT

    prompt = TOPIC_DISCOVERY_PROMPT.format(
        existing_topics=", ".join(existing_topics),
        book_themes=", ".join(book_themes),
    )
    raw = _call_krutrim(prompt)
    try:
        json_match = re.search(r"\[[\s\S]+\]", raw)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception:
        pass
    return []
