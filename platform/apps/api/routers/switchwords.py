"""
Switch-word finder — meaning search over the remedy posts.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

router = APIRouter(prefix="/switchwords", tags=["Switch words"])


@router.get("")
def find_switch_words(q: str = Query(..., min_length=2, max_length=200), limit: int = Query(8, ge=1, le=20)):
    """Posts that speak to the need in `q`, each with the switch words it gives, exactly as written."""
    from rag.switchwords import search

    return search(q, limit)
