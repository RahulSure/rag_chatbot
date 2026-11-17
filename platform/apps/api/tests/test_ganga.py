"""
Ganga: floating diyas, the daily catch, replies, privacy between sadhaks and safety.

Same set-up as test_accounts: in-memory Mongo and a fake Google verifier.
Run from platform/:  python -m pytest apps/api/tests -q
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta

import mongomock
import pytest
from fastapi.testclient import TestClient

from apps.api import deps
from apps.api.main import app
from services.ganga.maitri import derive_sky, maitri
from services.ganga.moderation import check

USERS = {
    "token-asha": {"sub": "g-asha", "email": "asha@example.com", "name": "Asha", "email_verified": True},
    "token-ravi": {"sub": "g-ravi", "email": "ravi@example.com", "name": "Ravi", "email_verified": True},
    "token-meera": {"sub": "g-meera", "email": "meera@example.com", "name": "Meera", "email_verified": True},
}
DIYA = "I have started Gayatri japa every morning. How do I keep my mind steady when it wanders?"


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")
    client = mongomock.MongoClient()
    monkeypatch.setattr(deps, "get_mongo_client", lambda: client)
    from google.oauth2 import id_token

    monkeypatch.setattr(id_token, "verify_oauth2_token", lambda token, _r, _aud: dict(USERS[token]))
    yield client


def sadhak(token: str, name: str, languages=("en",), practices=("japa",), birth=None) -> TestClient:
    c = TestClient(app)
    assert c.post("/auth/google", json={"credential": token}).status_code == 200
    body = {"name": name, "languages": list(languages), "practices": list(practices), "adult": True, "accept_rules": True}
    if birth:
        body["birth"] = birth
    r = c.put("/ganga/me", json=body)
    assert r.status_code == 200, r.text
    return c


# ── Joining ──────────────────────────────────────────────────────────────────

def test_joining_needs_sign_in_consent_and_a_clean_pen_name():
    assert TestClient(app).get("/ganga/me").status_code == 401
    c = TestClient(app)
    c.post("/auth/google", json={"credential": "token-asha"})
    assert c.get("/ganga/me").json() == {"profile": None}
    base = {"name": "Asha", "languages": ["en"], "practices": [], "accept_rules": True}
    assert c.put("/ganga/me", json={**base, "adult": False}).json()["detail"]["code"] == "consent"
    assert c.put("/ganga/me", json={**base, "adult": True, "name": "call 9876543210"}).json()["detail"]["code"] == "name"
    assert c.put("/ganga/me", json={**base, "adult": True}).json()["profile"]["name"] == "Asha"
    # Floating needs a profile
    other = TestClient(app)
    other.post("/auth/google", json={"credential": "token-ravi"})
    assert other.post("/ganga/diyas", json={"kind": "seeking", "text": DIYA}).status_code == 409


def test_birth_details_give_a_kundli_match_but_are_not_stored(env):
    birth = {"date": "1990-05-15", "time": "10:30", "latitude": 28.6139, "longitude": 77.209, "tz": "Asia/Kolkata"}
    c = sadhak("token-asha", "Asha", birth=birth)
    assert c.get("/ganga/me").json()["profile"]["by_kundli"] is True
    stored = deps.get_db()["ganga_profiles"].find_one({})
    assert "birth" not in stored and set(stored["sky"]) == {"moon_sign", "nakshatra", "gana", "moolank", "loshu"}


# ── Floating ─────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("text,code", [
    ("Please message me on WhatsApp 98765 43210 for guidance on sadhana", "contact"),
    ("Send me money on UPI and I will do a special puja for you", "money"),
    ("I want vashikaran on my ex so she comes back to me, please help", "control"),
    ("I feel there is no reason to live any more, I want to die", "crisis"),
    ("short", "too_short"),
])
def test_unsafe_diyas_are_not_floated(text, code):
    c = sadhak("token-asha", "Asha")
    r = c.post("/ganga/diyas", json={"kind": "seeking", "text": text})
    assert r.status_code == 422 and r.json()["detail"]["code"] == code
    assert deps.get_db()["ganga_diyas"].count_documents({}) == 0


def test_three_diyas_a_day():
    c = sadhak("token-asha", "Asha")
    for _ in range(3):
        assert c.post("/ganga/diyas", json={"kind": "sharing", "text": DIYA}).status_code == 200
    assert c.post("/ganga/diyas", json={"kind": "sharing", "text": DIYA}).json()["detail"]["code"] == "float_limit"


# ── The catch ────────────────────────────────────────────────────────────────

def test_the_river_brings_others_diyas_never_your_own():
    asha = sadhak("token-asha", "Asha")
    asha.post("/ganga/diyas", json={"kind": "seeking", "text": DIYA})
    assert asha.get("/ganga/catch").json()["diyas"] == []

    ravi = sadhak("token-ravi", "Ravi")
    catch = ravi.get("/ganga/catch").json()
    assert catch["share"] >= 3 and len(catch["diyas"]) == 1
    caught = catch["diyas"][0]
    assert caught["from"] == "Asha" and caught["text"] == DIYA and 0 <= caught["maitri"]["score"] <= 100
    assert "email" not in str(caught) and "asha@example.com" not in str(caught)
    # Asking again keeps the same catch instead of bringing more
    assert [d["id"] for d in ravi.get("/ganga/catch").json()["diyas"]] == [caught["id"]]


def test_language_decides_who_meets_a_diya():
    asha = sadhak("token-asha", "Asha")
    asha.post("/ganga/diyas", json={"kind": "seeking", "text": DIYA})
    hindi_only = sadhak("token-ravi", "Ravi", languages=("hi",))
    assert hindi_only.get("/ganga/catch").json()["diyas"] == []


def test_bless_and_pass():
    asha = sadhak("token-asha", "Asha")
    asha.post("/ganga/diyas", json={"kind": "prayer", "text": DIYA})
    ravi = sadhak("token-ravi", "Ravi")
    cid = ravi.get("/ganga/catch").json()["diyas"][0]["id"]
    assert ravi.post(f"/ganga/catches/{cid}/bless").status_code == 200
    ravi.post(f"/ganga/catches/{cid}/bless")  # a second tap counts once
    assert asha.get("/ganga/diyas/mine").json()[0]["blessings"] == 1

    meera = sadhak("token-meera", "Meera")
    mid = meera.get("/ganga/catch").json()["diyas"][0]["id"]  # still floating after the blessing
    assert meera.post(f"/ganga/catches/{mid}/pass").status_code == 200
    # Nobody can act on a catch that isn't theirs
    assert asha.post(f"/ganga/catches/{mid}/bless").status_code == 404


def test_reply_opens_a_private_thread():
    asha = sadhak("token-asha", "Asha")
    asha.post("/ganga/diyas", json={"kind": "seeking", "text": DIYA})
    ravi = sadhak("token-ravi", "Ravi")
    cid = ravi.get("/ganga/catch").json()["diyas"][0]["id"]
    assert ravi.post(f"/ganga/catches/{cid}/reply", json={"text": "Call me at 9876543210"}).json()["detail"]["code"] == "contact"
    tid = ravi.post(f"/ganga/catches/{cid}/reply", json={"text": "Begin with five minutes of breath before japa."}).json()["thread"]

    assert asha.get("/ganga/me").json()["unread"] == 1
    threads = asha.get("/ganga/threads").json()
    assert threads[0]["with"] == "Ravi" and threads[0]["unread"] is True
    letters = asha.get(f"/ganga/threads/{tid}").json()["letters"]
    assert letters[0]["text"].startswith("Begin with") and letters[0]["mine"] is False
    assert asha.get("/ganga/me").json()["unread"] == 0
    assert asha.post(f"/ganga/threads/{tid}/letters", json={"text": "Thank you, I will try it tomorrow."}).status_code == 200
    assert [l["mine"] for l in ravi.get(f"/ganga/threads/{tid}").json()["letters"]] == [True, False]

    meera = sadhak("token-meera", "Meera")
    assert meera.get(f"/ganga/threads/{tid}").status_code == 404
    assert meera.post(f"/ganga/threads/{tid}/letters", json={"text": "hello"}).status_code == 404
    assert meera.get("/ganga/threads").json() == []


def test_blocking_closes_the_thread_and_keeps_them_apart():
    asha = sadhak("token-asha", "Asha")
    asha.post("/ganga/diyas", json={"kind": "seeking", "text": DIYA})
    ravi = sadhak("token-ravi", "Ravi")
    cid = ravi.get("/ganga/catch").json()["diyas"][0]["id"]
    tid = ravi.post(f"/ganga/catches/{cid}/reply", json={"text": "A thoughtful answer for you."}).json()["thread"]
    assert asha.post(f"/ganga/threads/{tid}/block").status_code == 200
    assert ravi.post(f"/ganga/threads/{tid}/letters", json={"text": "Hello again"}).json()["detail"]["code"] == "closed"
    # Ravi's new diya never reaches Asha
    ravi.post("/ganga/diyas", json={"kind": "sharing", "text": DIYA})
    assert asha.get("/ganga/catch").json()["diyas"] == []


def test_two_reports_take_a_diya_off_the_river():
    asha = sadhak("token-asha", "Asha")
    asha.post("/ganga/diyas", json={"kind": "sharing", "text": DIYA})
    for token, name in (("token-ravi", "Ravi"), ("token-meera", "Meera")):
        c = sadhak(token, name)
        cid = c.get("/ganga/catch").json()["diyas"][0]["id"]
        assert c.post(f"/ganga/catches/{cid}/report", json={"reason": "spam"}).status_code == 200
    assert deps.get_db()["ganga_diyas"].find_one({})["status"] == "removed"
    assert asha.get("/ganga/diyas/mine").json() == []


def test_sadhak_blesses_a_diya_nobody_answered():
    asha = sadhak("token-asha", "Asha")
    asha.post("/ganga/diyas", json={"kind": "prayer", "text": DIYA})
    deps.get_db()["ganga_diyas"].update_many({}, {"$set": {"created_at": datetime.utcnow() - timedelta(hours=25)}})
    assert asha.get("/ganga/diyas/mine").json()[0]["sadhak_blessed"] is True


def test_leaving_removes_everything():
    asha = sadhak("token-asha", "Asha")
    asha.post("/ganga/diyas", json={"kind": "seeking", "text": DIYA})
    ravi = sadhak("token-ravi", "Ravi")
    cid = ravi.get("/ganga/catch").json()["diyas"][0]["id"]
    ravi.post(f"/ganga/catches/{cid}/reply", json={"text": "A kind reply for you."})
    assert asha.delete("/ganga/me").status_code == 204
    db = deps.get_db()
    assert db["ganga_diyas"].count_documents({}) == 0 and db["ganga_letters"].count_documents({}) == 0
    assert db["ganga_threads"].count_documents({}) == 0 and db["ganga_profiles"].count_documents({"name": "Asha"}) == 0
    assert ravi.get("/ganga/threads").json() == []


# ── Maitri and moderation ────────────────────────────────────────────────────

def test_maitri_scores_and_reasons():
    a = {"practices": ["japa", "meditation"], "sky": derive_sky(date(1990, 5, 15), time(10, 30), "Asia/Kolkata", 28.61, 77.21)}
    b = {"practices": ["japa"], "sky": derive_sky(date(1992, 3, 10), time(8, 15), "Asia/Kolkata", 26.91, 75.79)}
    m = maitri(a, b)
    assert 0 <= m["score"] <= 100 and m["by_kundli"] is True
    assert {"code": "shared_practice", "items": ["japa"]} in m["reasons"]
    assert maitri(a, b)["score"] == maitri(b, a)["score"]
    plain = maitri({"practices": ["japa"]}, {"practices": ["japa"]})
    assert plain == {"score": 60, "reasons": [{"code": "shared_practice", "items": ["japa"]}], "by_kundli": False}


@pytest.mark.parametrize("text", [
    "My guru taught me to begin japa with three deep breaths and a short prayer.",
    "आज पूर्णिमा पर मैंने गुरु मंत्र की ग्यारह माला की, मन बहुत शांत है।",
    "Ekadashi fast was hard this time; how do you keep the mind on the Lord?",
])
def test_ordinary_diyas_pass(text):
    assert check(text) is None
