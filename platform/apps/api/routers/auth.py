"""
Auth router — Google sign-in, current user, sign-out.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response

from apps.api.auth import (
    clear_session_cookie,
    issue_session,
    require_user,
    set_session_cookie,
    upsert_google_user,
    user_out,
    verify_google_credential,
)
from packages.shared.schemas import GoogleLoginRequest, UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/google", response_model=UserOut)
def google_login(req: GoogleLoginRequest, response: Response):
    """Exchange a Google ID token for a Sadhak session (httpOnly cookie)."""
    claims = verify_google_credential(req.credential)
    user = upsert_google_user(claims)
    set_session_cookie(response, issue_session(str(user["_id"])))
    return user_out(user)


@router.get("/me", response_model=UserOut)
def me(user: dict = Depends(require_user)):
    return user_out(user)


@router.post("/logout", status_code=204)
def logout(response: Response):
    clear_session_cookie(response)
