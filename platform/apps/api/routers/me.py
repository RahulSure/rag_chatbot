"""
Signed-in user's own data — synced profile (birth details, place, japa) and saved chats.
Every query is scoped to the current user's id, so one user can never read another's data.
"""

from __future__ import annotations

import json
from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from apps.api.auth import require_user
from apps.api.deps import get_db
from packages.shared.schemas import ConversationDetail, ConversationSummary, ProfileData

router = APIRouter(prefix="/me", tags=["Me"])

MAX_PROFILE_BYTES = 20_000  # each synced item is a small JSON blob from localStorage


def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Conversation not found")


# ──────────────────────────────────────────────────────────────────────────────
# Profile sync
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=ProfileData)
def get_profile(user: dict = Depends(require_user)):
    return user.get("profile") or {}


@router.put("/profile", response_model=ProfileData)
def update_profile(data: ProfileData, user: dict = Depends(require_user)):
    """Merge the given items into the profile; items left out (null) are kept as they are."""
    fields = data.model_dump(exclude_none=True, exclude={"updated_at"})
    for key, value in fields.items():
        if len(json.dumps(value)) > MAX_PROFILE_BYTES:
            raise HTTPException(status_code=413, detail=f"'{key}' is too large")

    now = datetime.utcnow()
    update = {f"profile.{k}": v for k, v in fields.items()}
    update["profile.updated_at"] = now
    users = get_db()["users"]
    users.update_one({"_id": user["_id"]}, {"$set": update})
    return users.find_one({"_id": user["_id"]}, {"profile": 1}).get("profile") or {}


# ──────────────────────────────────────────────────────────────────────────────
# Saved conversations
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(
    user: dict = Depends(require_user),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    pipeline = [
        {"$match": {"user_id": user["_id"]}},
        {"$sort": {"updated_at": -1}},
        {"$skip": offset},
        {"$limit": limit},
        {"$project": {"title": 1, "updated_at": 1, "turn_count": {"$size": {"$ifNull": ["$turns", []]}}}},
    ]
    return [
        ConversationSummary(id=str(d["_id"]), title=d.get("title") or "Untitled", updated_at=d["updated_at"], turn_count=d["turn_count"])
        for d in get_db()["conversations"].aggregate(pipeline)
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(conversation_id: str, user: dict = Depends(require_user)):
    doc = get_db()["conversations"].find_one({"_id": _oid(conversation_id), "user_id": user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationDetail(
        id=str(doc["_id"]),
        title=doc.get("title") or "Untitled",
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        turns=doc.get("turns", []),
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: str, user: dict = Depends(require_user)):
    result = get_db()["conversations"].delete_one({"_id": _oid(conversation_id), "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
