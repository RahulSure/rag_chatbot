"""
Google sign-in and session tokens.

Flow: the web app shows Google's Sign-In button, which yields a Google ID token.
POST /auth/google verifies it here, upserts the user, and we issue our own
session JWT — set as an httpOnly cookie for the browser, and also accepted as
`Authorization: Bearer` so a future mobile app can use the same backend auth.

Signing in is optional: `get_current_user_optional` returns None for visitors.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import jwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, Request, Response, status

from apps.api.deps import get_db

SESSION_COOKIE = "sadhak_session"
SESSION_DAYS = 30
_JWT_ALG = "HS256"


def _google_client_id() -> str:
    return os.getenv("GOOGLE_CLIENT_ID", "")


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "")
    if not secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Sign-in is not configured (JWT_SECRET)")
    return secret


# ──────────────────────────────────────────────────────────────────────────────
# Google ID token
# ──────────────────────────────────────────────────────────────────────────────

def verify_google_credential(credential: str) -> dict:
    """Verify a Google ID token (signature, audience, issuer, expiry) and return its claims."""
    client_id = _google_client_id()
    if not client_id:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Sign-in is not configured (GOOGLE_CLIENT_ID)")

    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        claims = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google credential")

    if not claims.get("email_verified"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google account email is not verified")
    return claims


# ──────────────────────────────────────────────────────────────────────────────
# Our session token
# ──────────────────────────────────────────────────────────────────────────────

def issue_session(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": user_id, "iat": now, "exp": now + timedelta(days=SESSION_DAYS)}
    return jwt.encode(payload, _jwt_secret(), algorithm=_JWT_ALG)


def decode_session(token: str) -> str | None:
    """Return the user id in a valid session token, else None."""
    secret = os.getenv("JWT_SECRET", "")
    if not secret or not token:
        return None
    try:
        payload = jwt.decode(token, secret, algorithms=[_JWT_ALG])
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    return sub if isinstance(sub, str) else None


def _cookie_secure() -> bool:
    return os.getenv("COOKIE_SECURE", "false").lower() in ("1", "true", "yes")


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/", secure=_cookie_secure(), samesite="lax", httponly=True)


# ──────────────────────────────────────────────────────────────────────────────
# Users
# ──────────────────────────────────────────────────────────────────────────────

def upsert_google_user(claims: dict) -> dict:
    """Create or refresh the user for a verified Google identity; returns the user document."""
    now = datetime.utcnow()
    users = get_db()["users"]
    users.update_one(
        {"google_sub": claims["sub"]},
        {
            "$set": {
                "email": claims.get("email", ""),
                "name": claims.get("name"),
                "picture": claims.get("picture"),
                "last_login_at": now,
            },
            "$setOnInsert": {"google_sub": claims["sub"], "created_at": now},
        },
        upsert=True,
    )
    return users.find_one({"google_sub": claims["sub"]})


def user_out(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user.get("email", ""),
        "name": user.get("name"),
        "picture": user.get("picture"),
    }


def _token_from_request(request: Request) -> str | None:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        return token
    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip() or None
    return None


def get_current_user_optional(request: Request) -> dict | None:
    """The signed-in user's document, or None for anonymous visitors (never raises)."""
    user_id = decode_session(_token_from_request(request) or "")
    if not user_id:
        return None
    try:
        return get_db()["users"].find_one({"_id": ObjectId(user_id)})
    except (InvalidId, Exception):
        return None


def require_user(user: dict | None = Depends(get_current_user_optional)) -> dict:
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in required")
    return user


def ensure_indexes() -> None:
    """Create account indexes. Safe to call on every startup; skipped if Mongo is unreachable."""
    try:
        db = get_db()
        db["users"].create_index("google_sub", unique=True)
        db["conversations"].create_index([("user_id", 1), ("updated_at", -1)])
    except Exception:
        pass
