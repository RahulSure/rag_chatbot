"""
Email subscription endpoint — captures emails for newsletter/launch announcements.
"""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException

from apps.api.deps import get_db

router = APIRouter(prefix="/subscribe", tags=["Subscribe"])


class EmailSubscribeRequest(BaseModel):
    email: str
    source: str = "homepage"


@router.post("/email")
def subscribe_email(req: EmailSubscribeRequest):
    """Capture email for newsletter / WhatsApp bot launch notification."""
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    db = get_db()
    col = db["email_subscribers"]

    # Avoid duplicates
    existing = col.find_one({"email": email})
    if existing:
        return {"status": "already_subscribed", "message": "You're already on the list! 🙏"}

    col.insert_one({
        "email": email,
        "source": req.source,
        "subscribed_at": datetime.utcnow(),
    })

    return {"status": "subscribed", "message": "You're on the list! We'll notify you when WhatsApp bot launches. 🙏"}
