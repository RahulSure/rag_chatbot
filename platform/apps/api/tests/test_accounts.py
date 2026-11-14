"""
Google sign-in, saved chats, profile sync and per-user rate limits.

MongoDB is replaced with mongomock and Google's token verifier is patched at the
library boundary (so our own checks, like email_verified, still run). The RAG
pipeline is stubbed. Run from platform/:  python -m pytest apps/api/tests -q
"""

from __future__ import annotations

import sys
import types

import mongomock
import pytest
from fastapi.testclient import TestClient

from apps.api import deps
from apps.api.main import app
from apps.api.middleware import query_rate_limiter
from apps.api.routers import query as query_router

GOOGLE_USERS = {
    "token-asha": {"sub": "g-asha", "email": "asha@example.com", "name": "Asha", "picture": "https://x/a.png", "email_verified": True},
    "token-ravi": {"sub": "g-ravi", "email": "ravi@example.com", "name": "Ravi", "email_verified": True},
    "token-unverified": {"sub": "g-unv", "email": "u@example.com", "email_verified": False},
}


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")

    # Fresh in-memory Mongo per test
    client = mongomock.MongoClient()
    monkeypatch.setattr(deps, "get_mongo_client", lambda: client)

    # Google verifier: accept our fake tokens, check the audience we pass
    from google.oauth2 import id_token

    def fake_verify(token, _request, audience):
        assert audience == "test-client-id.apps.googleusercontent.com"
        if token not in GOOGLE_USERS:
            raise ValueError("bad token")
        return dict(GOOGLE_USERS[token])

    monkeypatch.setattr(id_token, "verify_oauth2_token", fake_verify)

    # Stub the RAG pipeline, follow-ups and Redis
    fake_answer = types.ModuleType("rag.answer")
    fake_answer.answer_question = lambda question, **kw: (f"Answer to: {question}", [], False)
    monkeypatch.setitem(sys.modules, "rag.answer", fake_answer)
    monkeypatch.setattr(query_router, "_generate_follow_ups", lambda q, a: ["Next?"])
    monkeypatch.setattr(query_router, "get_redis_optional", lambda: None)

    query_rate_limiter._store.clear()
    yield client


def signed_in(token: str = "token-asha") -> TestClient:
    c = TestClient(app)
    r = c.post("/auth/google", json={"credential": token})
    assert r.status_code == 200, r.text
    return c


# ── Auth ─────────────────────────────────────────────────────────────────────

def test_google_login_creates_user_and_sets_httponly_cookie(env):
    c = TestClient(app)
    r = c.post("/auth/google", json={"credential": "token-asha"})
    assert r.status_code == 200
    assert r.json()["email"] == "asha@example.com"
    cookie = r.headers["set-cookie"]
    assert "sadhak_session=" in cookie and "HttpOnly" in cookie and "samesite=lax" in cookie.lower()
    assert c.get("/auth/me").json()["name"] == "Asha"


def test_second_login_reuses_the_same_user(env):
    first = signed_in().get("/auth/me").json()["id"]
    second = signed_in().get("/auth/me").json()["id"]
    assert first == second
    assert deps.get_db()["users"].count_documents({}) == 1


def test_rejects_bad_and_unverified_google_tokens():
    c = TestClient(app)
    assert c.post("/auth/google", json={"credential": "forged"}).status_code == 401
    assert c.post("/auth/google", json={"credential": "token-unverified"}).status_code == 401


def test_me_requires_a_session_and_logout_clears_it():
    assert TestClient(app).get("/auth/me").status_code == 401
    c = signed_in()
    assert c.post("/auth/logout").status_code == 204
    assert c.get("/auth/me").status_code == 401


def test_bearer_token_is_accepted():
    c = signed_in()
    token = c.cookies.get("sadhak_session")
    fresh = TestClient(app)
    assert fresh.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    assert fresh.get("/auth/me", headers={"Authorization": "Bearer junk"}).status_code == 401


# ── Saved conversations ──────────────────────────────────────────────────────

def test_signed_in_chat_is_saved_and_continues_the_same_conversation():
    c = signed_in()
    r1 = c.post("/query", json={"question": "What is japa?"}).json()
    r2 = c.post("/query", json={"question": "How many malas?", "session_id": r1["session_id"]}).json()
    assert r1["session_id"] == r2["session_id"]

    convos = c.get("/me/conversations").json()
    assert len(convos) == 1 and convos[0]["title"] == "What is japa?" and convos[0]["turn_count"] == 2

    detail = c.get(f"/me/conversations/{r1['session_id']}").json()
    assert [t["q"] for t in detail["turns"]] == ["What is japa?", "How many malas?"]
    assert detail["turns"][0]["suggested"] == ["Next?"]


def test_conversations_are_private_to_their_owner():
    asha = signed_in("token-asha")
    sid = asha.post("/query", json={"question": "Private question"}).json()["session_id"]

    ravi = signed_in("token-ravi")
    assert ravi.get(f"/me/conversations/{sid}").status_code == 404
    assert ravi.delete(f"/me/conversations/{sid}").status_code == 404
    assert ravi.get("/me/conversations").json() == []
    # Sending Asha's id doesn't append to her chat — Ravi gets a new conversation
    assert ravi.post("/query", json={"question": "Hi", "session_id": sid}).json()["session_id"] != sid
    assert asha.get(f"/me/conversations/{sid}").json()["turns"][-1]["q"] == "Private question"


def test_delete_conversation():
    c = signed_in()
    sid = c.post("/query", json={"question": "Delete me"}).json()["session_id"]
    assert c.delete(f"/me/conversations/{sid}").status_code == 204
    assert c.get(f"/me/conversations/{sid}").status_code == 404
    assert c.get("/me/conversations/not-an-id").status_code == 404


def test_anonymous_chat_is_not_saved_to_mongo(env):
    c = TestClient(app)
    assert c.post("/query", json={"question": "Anon?"}).status_code == 200
    assert c.get("/me/conversations").status_code == 401
    assert deps.get_db()["conversations"].count_documents({}) == 0


# ── Profile sync ─────────────────────────────────────────────────────────────

def test_profile_merge_and_privacy():
    c = signed_in()
    assert c.get("/me/profile").json().get("birth") is None
    c.put("/me/profile", json={"birth": {"date": "1990-01-01", "time": "06:30"}})
    c.put("/me/profile", json={"japa": {"count": 108}})  # birth is kept
    p = c.get("/me/profile").json()
    assert p["birth"]["time"] == "06:30" and p["japa"]["count"] == 108

    assert signed_in("token-ravi").get("/me/profile").json().get("birth") is None
    assert TestClient(app).get("/me/profile").status_code == 401


def test_profile_rejects_oversized_items():
    c = signed_in()
    assert c.put("/me/profile", json={"japa": {"blob": "x" * 30_000}}).status_code == 413


# ── Rate limits ──────────────────────────────────────────────────────────────

def test_anonymous_limit_is_per_ip_and_mentions_sign_in():
    c = TestClient(app)
    for _ in range(query_rate_limiter.max_requests):
        assert c.post("/query", json={"question": "q"}).status_code == 200
    r = c.post("/query", json={"question": "q"})
    assert r.status_code == 429 and "Sign in" in r.json()["detail"]


def test_signed_in_users_get_their_own_higher_limit():
    c = signed_in()
    for _ in range(query_rate_limiter.max_requests_user):
        assert c.post("/query", json={"question": "q"}).status_code == 200
    assert c.post("/query", json={"question": "q"}).status_code == 429
    # Another user from the same IP is unaffected
    assert signed_in("token-ravi").post("/query", json={"question": "q"}).status_code == 200
