"""
Switch-word finder: meaning search over the remedy posts (switch words, Bach
flower remedies, Reiki), returning the switch words each post gives exactly as
written. The same ranking lets answers offer a fitting remedy as support.
"""

from __future__ import annotations

import re
from functools import lru_cache

from rag.hide_names import clean_title, hide_names

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
    """All remedy chunks with their embeddings, normalised, held in memory (a few thousand rows)."""
    import numpy as np
    from rag.vector_store import MONGODB_COLLECTION, MONGODB_DB_NAME, _get_mongo_client

    coll = _get_mongo_client()[MONGODB_DB_NAME][MONGODB_COLLECTION]
    rows = list(coll.find({"metadata.remedy": True},
                          {"embedding": 1, "text": 1, "metadata.source_url": 1, "metadata.chapter_title": 1,
                           "metadata.topic": 1, "metadata.book": 1}))
    if not rows:
        return np.zeros((0, 1)), []
    vectors = np.asarray([r["embedding"] for r in rows], dtype="float32")
    vectors /= np.linalg.norm(vectors, axis=1, keepdims=True) + 1e-9
    return vectors, [{"url": r["metadata"]["source_url"], "title": r["metadata"].get("chapter_title") or "",
                      "topic": r["metadata"].get("topic"), "book": r["metadata"].get("book"), "chunk": r["text"]}
                     for r in rows]


def best_posts(query: str, k: int = 8, min_score: float = 0.0, exclude: set[str] | None = None) -> list[dict]:
    """The k posts that best fit the query and give switch words, best first, each with its full text."""
    import numpy as np
    from rag.answer import _full_articles
    from rag.embeddings import get_embedding_model

    vectors, meta = _index()
    if not meta:
        return []
    q = np.asarray(get_embedding_model().get_query_embedding(query), dtype="float32")
    q /= np.linalg.norm(q) + 1e-9
    scores = vectors @ q
    best: dict[str, tuple[float, dict]] = {}
    pool = max(k * 3, 12)  # many posts are stories without switch words, so look a little wider
    for i in np.argsort(-scores)[: pool * 6]:
        m, score = meta[int(i)], float(scores[int(i)])
        if score < min_score:
            break
        if m["url"] not in (exclude or set()):
            best.setdefault(m["url"], (score, m))
        if len(best) >= pool:
            break
    articles = _full_articles(list(best))
    out = []
    for url, (score, m) in best.items():
        text = hide_names(articles.get(url, {}).get("text") or m["chunk"])
        if extract_switch_words(text):
            out.append({**m, "title": clean_title(m["title"]), "chunk": hide_names(m["chunk"]), "text": text, "score": score})
        if len(out) >= k:
            break
    return out


def search(query: str, limit: int = 8) -> list[dict]:
    return [
        {"title": p["title"], "topic": p["topic"], "switch_words": extract_switch_words(p["text"])[:8],
         "excerpt": re.sub(r"\s+", " ", p["chunk"]).strip()[:320]}
        for p in best_posts(query, k=limit)
    ]
