"""
Daily Wisdom and Semantic Search endpoints.
"""

from __future__ import annotations

import hashlib
import os
import random
from datetime import date

from fastapi import APIRouter, Query

from packages.shared.schemas import DailyWisdom, SearchResult
from apps.api.deps import get_collection, get_redis_optional

router = APIRouter(tags=["Discovery"])

DAILY_WISDOM_CACHE_KEY = "daily_wisdom"
DAILY_WISDOM_TTL = 86400  # 24 hours


@router.get("/daily-wisdom", response_model=DailyWisdom)
def get_daily_wisdom():
    """
    Returns a curated passage from Sadgurudev's books for today.
    Deterministic per day (same passage all day), cached in Redis.
    """
    today = date.today().isoformat()
    cache_key = f"{DAILY_WISDOM_CACHE_KEY}:{today}"

    r = get_redis_optional()
    if r:
        cached = r.get(cache_key)
        if cached:
            import json
            return DailyWisdom(**json.loads(cached))

    try:
        coll = get_collection()
        total = coll.count_documents({})
        if total == 0:
            return _fallback_wisdom(today)

        seed = int(hashlib.md5(today.encode()).hexdigest(), 16) % total
        docs = list(coll.find({}, {
            "text": 1, "metadata.page": 1, "metadata.book": 1,
            "metadata.chapter_title": 1, "metadata.language": 1,
        }).skip(seed).limit(1))

        if not docs:
            return _fallback_wisdom(today)

        doc = docs[0]
        text = doc.get("text", "")
        meta = doc.get("metadata", {})

        text = text[:400].strip()
        if len(doc.get("text", "")) > 400:
            text += "..."

        wisdom = DailyWisdom(
            text=text,
            book=meta.get("book"),
            page=meta.get("page"),
            chapter=meta.get("chapter_title"),
            language=meta.get("language", "hi"),
            date=today,
        )

        if r:
            import json
            r.setex(cache_key, DAILY_WISDOM_TTL, json.dumps(wisdom.model_dump(), default=str))

        return wisdom

    except Exception:
        return _fallback_wisdom(today)


def _fallback_wisdom(today: str) -> DailyWisdom:
    passages = [
        "सौन्दर्य केवल बाह्य रूप नहीं है, यह आत्मा का प्रकाश है जो शरीर के माध्यम से प्रकट होता है।",
        "साधना वह मार्ग है जिस पर चलकर साधक परमात्मा तक पहुँचता है।",
        "गुरु का आशीर्वाद ही सबसे बड़ी शक्ति है। उसकी कृपा से असाध्य भी साध्य हो जाता है।",
        "मंत्र में वह शक्ति है जो सृष्टि को आंदोलित कर सकती है। श्रद्धा और विश्वास से किया गया जाप अवश्य फलीभूत होता है।",
    ]
    seed = int(hashlib.md5(today.encode()).hexdigest(), 16) % len(passages)
    return DailyWisdom(
        text=passages[seed],
        book="Saundarya",
        language="hi",
        date=today,
    )


@router.get("/search", response_model=list[SearchResult])
def semantic_search(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(8, ge=1, le=20),
    topic: str | None = Query(None),
    book_slug: str | None = Query(None),
    language: str | None = Query(None),
):
    """
    Pure semantic search — retrieves relevant chunks without generating an answer.
    Useful for browsing teachings by concept.
    """
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "services" / "rag-service"))

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

        retriever = VectorIndexRetriever(index=index, similarity_top_k=limit)
        nodes = retriever.retrieve(q)

        results = []
        for node in nodes:
            meta = node.metadata or {}
            if topic and meta.get("topic") != topic:
                continue
            if book_slug and meta.get("book_slug") != book_slug:
                continue
            if language and meta.get("language") != language:
                continue
            text = node.text or ""
            snippet = text[:350].strip() + ("..." if len(text) > 350 else "")
            results.append(SearchResult(
                text_snippet=snippet,
                book=meta.get("book"),
                page=meta.get("page"),
                chapter=meta.get("chapter_title"),
                topic=meta.get("topic"),
                score=node.score,
            ))

        return results[:limit]

    except Exception as e:
        return []
