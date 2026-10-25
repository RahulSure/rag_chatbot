"""
Switch-word finder: meaning search over Naran S. Balakumar's posts, returning
the switch words each matching post gives, exactly as written there.
"""

from __future__ import annotations

import re
from functools import lru_cache

# A quoted run of capitalised words: ‘TOGETHER CHANGE ADJUST’ or "COUNT".
_QUOTED = re.compile(r"[\"“‘']\s*([A-Z]{2,}(?:[ ,\-–]+[A-Z]{2,})*)\s*[\"”’']")
_NOT_SWITCH = {"OK", "TV", "USA", "UK", "PM", "AM", "SMS", "DIY", "ICU", "NOTE"}


def extract_switch_words(text: str) -> list[str]:
    """Every quoted switch word or combination in a post, in order, without repeats."""
    seen, out = set(), []
    for m in _QUOTED.finditer(text):
        phrase = re.sub(r"\s+", " ", m.group(1)).strip(" ,-–")
        if len(phrase.replace(" ", "")) < 3 or phrase in _NOT_SWITCH or phrase in seen:
            continue
        seen.add(phrase)
        out.append(phrase)
    return out


@lru_cache(maxsize=1)
def _index():
    """All teacher chunks with their embeddings, normalised, held in memory (a few thousand rows)."""
    import numpy as np
    from rag.vector_store import MONGODB_COLLECTION, MONGODB_DB_NAME, _get_mongo_client

    coll = _get_mongo_client()[MONGODB_DB_NAME][MONGODB_COLLECTION]
    rows = list(coll.find({"metadata.teacher": {"$exists": True}},
                          {"embedding": 1, "text": 1, "metadata.source_url": 1, "metadata.chapter_title": 1, "metadata.topic": 1}))
    if not rows:
        return np.zeros((0, 1)), []
    vectors = np.asarray([r["embedding"] for r in rows], dtype="float32")
    vectors /= np.linalg.norm(vectors, axis=1, keepdims=True) + 1e-9
    return vectors, [{"url": r["metadata"]["source_url"], "title": r["metadata"].get("chapter_title") or "",
                      "topic": r["metadata"].get("topic"), "text": r["text"]} for r in rows]


def search(query: str, limit: int = 8) -> list[dict]:
    import numpy as np
    from rag.answer import _full_articles
    from rag.embeddings import get_embedding_model

    vectors, meta = _index()
    if not meta:
        return []
    q = np.asarray(get_embedding_model().get_query_embedding(query), dtype="float32")
    q /= np.linalg.norm(q) + 1e-9
    order = np.argsort(-(vectors @ q))

    best: dict[str, dict] = {}  # url -> best chunk, best first
    for i in order[: limit * 12]:
        m = meta[int(i)]
        best.setdefault(m["url"], m)
        if len(best) >= limit * 3:
            break
    articles = _full_articles(list(best))
    results = []
    for url, m in best.items():
        full = articles.get(url, {}).get("text") or m["text"]
        words = extract_switch_words(full)
        if not words:  # only posts that actually give switch words
            continue
        results.append({"title": m["title"], "topic": m["topic"], "switch_words": words[:8],
                        "excerpt": re.sub(r"\s+", " ", m["text"]).strip()[:320]})
        if len(results) >= limit:
            break
    return results
