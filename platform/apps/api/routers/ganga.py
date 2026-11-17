"""
Ganga — diyas floated between sadhaks.

A signed-in sadhak floats a diya (a short message). Each day the river brings a
few diyas to every sadhak, chosen by Maitri (kundli and numerology friendship) and
by who most needs an answer. The catcher replies (a private letter thread opens),
blesses it and lets it float on, or passes it on. Everyone appears by pen name only.

Every query is scoped to the signed-in user: one sadhak can read only their own
diyas, the diyas the river brought them and the threads they belong to.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from apps.api.auth import require_user
from apps.api.deps import get_db, require_admin
from packages.shared.schemas import DiyaIn, GANGA_PRACTICES, GangaProfileIn, GangaReportIn, LetterIn
from services.ganga.maitri import derive_sky, maitri
from services.ganga.moderation import check, check_name

router = APIRouter(prefix="/ganga", tags=["Ganga"])

DAILY_CATCH = 3            # diyas the river brings each day
BRAHMA_BONUS = 1           # one more for those who come between 4 and 6 in the morning
DAILY_FLOATS = 3           # diyas a sadhak may float in a day
DAILY_LETTERS = 40         # letters a sadhak may send in a day
DIYA_LIFE = timedelta(days=7)
MAX_HOLDERS = 3            # people holding a diya at once without having answered
HOLD_FOR = timedelta(hours=24)
SADHAK_BLESSES_AFTER = timedelta(hours=24)
REPORTS_TO_REMOVE = 2


def _db():
    return get_db()


def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Not found")


def _reject(reason: str):
    # 422 with a reason code; the app explains it in the writer's language (crisis shows help).
    raise HTTPException(status_code=422, detail={"code": reason})


def _profile(user: dict) -> dict:
    p = _db()["ganga_profiles"].find_one({"_id": user["_id"]})
    if not p:
        raise HTTPException(status_code=409, detail={"code": "no_profile"})
    if p.get("banned"):
        raise HTTPException(status_code=403, detail={"code": "banned"})
    return p


def _local_day_start(tz: str) -> datetime:
    try:
        zone = ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError):
        zone = ZoneInfo("Asia/Kolkata")
    now = datetime.now(zone)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)


def _local_hour(tz: str) -> int:
    try:
        return datetime.now(ZoneInfo(tz)).hour
    except (ZoneInfoNotFoundError, ValueError):
        return datetime.now(ZoneInfo("Asia/Kolkata")).hour


def _blocked_between(me: ObjectId) -> set[ObjectId]:
    """Everyone I blocked and everyone who blocked me."""
    blocks = _db()["ganga_blocks"]
    out = {b["blocked"] for b in blocks.find({"user": me})}
    out |= {b["user"] for b in blocks.find({"blocked": me})}
    return out


def _name_of(user_id: ObjectId) -> str:
    p = _db()["ganga_profiles"].find_one({"_id": user_id}, {"name": 1})
    return p["name"] if p else "A sadhak"


def _public_profile(p: dict) -> dict:
    return {
        "name": p["name"],
        "languages": p["languages"],
        "practices": p.get("practices", []),
        "by_kundli": bool(p.get("sky")),
        "tz": p.get("tz", "Asia/Kolkata"),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Your place on the river
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/me")
def ganga_me(user: dict = Depends(require_user)):
    p = _db()["ganga_profiles"].find_one({"_id": user["_id"]})
    if not p:
        return {"profile": None}
    unread = sum(
        1 for t in _db()["ganga_threads"].find({"members": user["_id"]}, {"updated_at": 1, "last_read": 1, "last_sender": 1})
        if t.get("last_sender") != user["_id"] and t["updated_at"] > (t.get("last_read") or {}).get(str(user["_id"]), datetime.min)
    )
    return {"profile": _public_profile(p), "unread": unread}


@router.put("/me")
def set_ganga_profile(data: GangaProfileIn, user: dict = Depends(require_user)):
    if not data.adult or not data.accept_rules:
        _reject("consent")
    name = " ".join(data.name.split())
    if check_name(name):
        _reject("name")
    practices = [p for p in data.practices if p in GANGA_PRACTICES]
    update = {"name": name, "languages": sorted(set(data.languages)), "practices": practices,
              "tz": data.tz, "updated_at": datetime.utcnow()}
    if data.birth:
        b = data.birth
        update["sky"] = derive_sky(b.date, b.time, b.tz, b.latitude, b.longitude)
    profiles = _db()["ganga_profiles"]
    profiles.update_one({"_id": user["_id"]},
                        {"$set": update, "$setOnInsert": {"created_at": datetime.utcnow(), "consented_at": datetime.utcnow()}},
                        upsert=True)
    if not data.birth:
        profiles.update_one({"_id": user["_id"]}, {"$unset": {"sky": ""}})
    return {"profile": _public_profile(profiles.find_one({"_id": user["_id"]}))}


@router.delete("/me", status_code=204)
def leave_ganga(user: dict = Depends(require_user)):
    """Remove everything this sadhak put on the river: profile, diyas, letters and blocks."""
    me, db = user["_id"], _db()
    mine = [d["_id"] for d in db["ganga_diyas"].find({"author": me}, {"_id": 1})]
    db["ganga_catches"].delete_many({"$or": [{"user": me}, {"diya": {"$in": mine}}]})
    db["ganga_diyas"].delete_many({"author": me})
    threads = [t["_id"] for t in db["ganga_threads"].find({"members": me}, {"_id": 1})]
    db["ganga_letters"].delete_many({"thread": {"$in": threads}})
    db["ganga_threads"].delete_many({"_id": {"$in": threads}})
    db["ganga_blocks"].delete_many({"$or": [{"user": me}, {"blocked": me}]})
    db["ganga_profiles"].delete_one({"_id": me})


# ──────────────────────────────────────────────────────────────────────────────
# Floating a diya
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/diyas")
def float_diya(data: DiyaIn, user: dict = Depends(require_user)):
    p = _profile(user)
    reason = check(data.text, "diya")
    if reason:
        _reject(reason)
    db = _db()
    if db["ganga_diyas"].count_documents({"author": user["_id"], "created_at": {"$gte": _local_day_start(p.get("tz", "Asia/Kolkata"))}}) >= DAILY_FLOATS:
        _reject("float_limit")
    text = data.text.strip()
    lang = "hi" if sum("ऀ" <= c <= "ॿ" for c in text) > len(text) * 0.2 else "en"
    diya = {"author": user["_id"], "kind": data.kind, "text": text, "lang": lang, "status": "floating",
            "created_at": datetime.utcnow(), "blessings": 0, "replies": 0, "reports": 0, "sadhak_blessed": False}
    diya["_id"] = db["ganga_diyas"].insert_one(diya).inserted_id
    return _my_diya(diya)


def _my_diya(d: dict) -> dict:
    return {"id": str(d["_id"]), "kind": d["kind"], "text": d["text"], "status": d["status"],
            "created_at": d["created_at"], "blessings": d.get("blessings", 0), "replies": d.get("replies", 0),
            "sadhak_blessed": d.get("sadhak_blessed", False)}


@router.get("/diyas/mine")
def my_diyas(user: dict = Depends(require_user)):
    db, now = _db(), datetime.utcnow()
    out = []
    for d in db["ganga_diyas"].find({"author": user["_id"], "status": {"$ne": "removed"}}).sort("created_at", -1).limit(30):
        # The river is never silent: a diya nobody answered in a day is blessed by Sadhak, in its own name.
        if (not d.get("sadhak_blessed") and d.get("blessings", 0) == 0 and d.get("replies", 0) == 0
                and now - d["created_at"] > SADHAK_BLESSES_AFTER):
            db["ganga_diyas"].update_one({"_id": d["_id"]}, {"$set": {"sadhak_blessed": True}})
            d["sadhak_blessed"] = True
        if d["status"] == "floating" and now - d["created_at"] > DIYA_LIFE:
            db["ganga_diyas"].update_one({"_id": d["_id"]}, {"$set": {"status": "settled"}})
            d["status"] = "settled"
        out.append(_my_diya(d))
    return out


# ──────────────────────────────────────────────────────────────────────────────
# What the river brings
# ──────────────────────────────────────────────────────────────────────────────

def _caught_view(c: dict, d: dict, me_profile: dict) -> dict:
    author = _db()["ganga_profiles"].find_one({"_id": d["author"]}) or {}
    return {
        "id": str(c["_id"]), "kind": d["kind"], "text": d["text"], "lang": d["lang"], "from": author.get("name", "A sadhak"),
        "created_at": d["created_at"], "action": c.get("action"), "thread": str(c["thread"]) if c.get("thread") else None,
        "maitri": maitri(me_profile, author) if author else {"score": 50, "reasons": [], "by_kundli": False},
    }


@router.get("/catch")
def todays_catch(user: dict = Depends(require_user)):
    """Today's diyas: keeps what the river already brought, and brings more up to the day's share."""
    me, db, p = user["_id"], _db(), _profile(user)
    tz = p.get("tz", "Asia/Kolkata")
    today = db["ganga_catches"].find({"user": me, "delivered_at": {"$gte": _local_day_start(tz)}})
    today = sorted(today, key=lambda c: c["delivered_at"])
    share = DAILY_CATCH + (BRAHMA_BONUS if 4 <= _local_hour(tz) < 6 else 0)
    want = share - len(today)

    if want > 0:
        now = datetime.utcnow()
        blocked = _blocked_between(me)
        seen = {c["diya"] for c in db["ganga_catches"].find({"user": me}, {"diya": 1})}
        candidates = db["ganga_diyas"].find({
            "status": "floating", "author": {"$ne": me, "$nin": list(blocked)}, "_id": {"$nin": list(seen)},
            "lang": {"$in": p["languages"]}, "created_at": {"$gte": now - DIYA_LIFE},
        }).limit(200)
        scored = []
        for d in candidates:
            holders = db["ganga_catches"].count_documents({"diya": d["_id"], "action": None, "delivered_at": {"$gte": now - HOLD_FOR}})
            if holders >= MAX_HOLDERS:
                continue
            author = db["ganga_profiles"].find_one({"_id": d["author"]})
            if not author:
                continue
            fit = maitri(p, author)["score"]
            unanswered = 30 if d.get("blessings", 0) + d.get("replies", 0) == 0 else 0
            fresh = max(0, 10 - (now - d["created_at"]).days * 2)
            scored.append((fit + unanswered + fresh, d["_id"]))
        for _, diya_id in sorted(scored, reverse=True)[:want]:
            db["ganga_catches"].insert_one({"diya": diya_id, "user": me, "delivered_at": now, "action": None})
        today = sorted(db["ganga_catches"].find({"user": me, "delivered_at": {"$gte": _local_day_start(tz)}}),
                       key=lambda c: c["delivered_at"])

    diyas = {d["_id"]: d for d in db["ganga_diyas"].find({"_id": {"$in": [c["diya"] for c in today]}})}
    caught = [_caught_view(c, diyas[c["diya"]], p) for c in today if c["diya"] in diyas and diyas[c["diya"]]["status"] != "removed"]
    return {"diyas": caught, "share": share, "left": max(0, share - len(today))}


def _my_catch(catch_id: str, user: dict) -> tuple[dict, dict]:
    c = _db()["ganga_catches"].find_one({"_id": _oid(catch_id), "user": user["_id"]})
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    d = _db()["ganga_diyas"].find_one({"_id": c["diya"]})
    if not d or d["status"] == "removed":
        raise HTTPException(status_code=404, detail="Not found")
    return c, d


def _act(c: dict, action: str, **extra):
    _db()["ganga_catches"].update_one({"_id": c["_id"]}, {"$set": {"action": action, "acted_at": datetime.utcnow(), **extra}})


@router.post("/catches/{catch_id}/bless")
def bless(catch_id: str, user: dict = Depends(require_user)):
    """A 🙏 to the writer; the diya floats on to someone else."""
    c, d = _my_catch(catch_id, user)
    if c.get("action"):
        return {"ok": True}
    _act(c, "blessed")
    _db()["ganga_diyas"].update_one({"_id": d["_id"]}, {"$inc": {"blessings": 1}})
    return {"ok": True}


@router.post("/catches/{catch_id}/pass")
def pass_on(catch_id: str, user: dict = Depends(require_user)):
    c, _ = _my_catch(catch_id, user)
    if not c.get("action"):
        _act(c, "passed")
    return {"ok": True}


@router.post("/catches/{catch_id}/reply")
def reply(catch_id: str, data: LetterIn, user: dict = Depends(require_user)):
    """Answer a diya: opens a private letter thread between the two sadhaks."""
    _profile(user)
    c, d = _my_catch(catch_id, user)
    if c.get("thread"):
        return {"thread": str(c["thread"])}
    if d["author"] in _blocked_between(user["_id"]):
        raise HTTPException(status_code=404, detail="Not found")
    reason = check(data.text, "letter")
    if reason:
        _reject(reason)
    _letter_quota(user)
    db, now = _db(), datetime.utcnow()
    thread_id = db["ganga_threads"].insert_one({
        "diya": d["_id"], "diya_text": d["text"][:200], "members": [d["author"], user["_id"]],
        "created_at": now, "updated_at": now, "last_sender": user["_id"], "last_read": {str(user["_id"]): now},
    }).inserted_id
    db["ganga_letters"].insert_one({"thread": thread_id, "sender": user["_id"], "text": data.text.strip(), "created_at": now})
    _act(c, "replied", thread=thread_id)
    db["ganga_diyas"].update_one({"_id": d["_id"]}, {"$inc": {"replies": 1}})
    return {"thread": str(thread_id)}


@router.post("/catches/{catch_id}/report")
def report_diya(catch_id: str, data: GangaReportIn, user: dict = Depends(require_user)):
    c, d = _my_catch(catch_id, user)
    db = _db()
    _act(c, "reported")
    db["ganga_reports"].insert_one({"kind": "diya", "target": d["_id"], "author": d["author"], "reporter": user["_id"],
                                    "reason": data.reason, "created_at": datetime.utcnow(), "status": "open"})
    reports = db["ganga_diyas"].find_one_and_update({"_id": d["_id"]}, {"$inc": {"reports": 1}}, return_document=True)
    if reports and reports.get("reports", 0) >= REPORTS_TO_REMOVE:
        db["ganga_diyas"].update_one({"_id": d["_id"]}, {"$set": {"status": "removed"}})
    return {"ok": True}


# ──────────────────────────────────────────────────────────────────────────────
# Letters
# ──────────────────────────────────────────────────────────────────────────────

def _letter_quota(user: dict):
    p = _db()["ganga_profiles"].find_one({"_id": user["_id"]}) or {}
    sent = _db()["ganga_letters"].count_documents({"sender": user["_id"], "created_at": {"$gte": _local_day_start(p.get("tz", "Asia/Kolkata"))}})
    if sent >= DAILY_LETTERS:
        _reject("letter_limit")


def _my_thread(thread_id: str, user: dict) -> dict:
    t = _db()["ganga_threads"].find_one({"_id": _oid(thread_id), "members": user["_id"]})
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    return t


def _other(t: dict, me: ObjectId) -> ObjectId:
    return next(m for m in t["members"] if m != me)


@router.get("/threads")
def threads(user: dict = Depends(require_user)):
    me = user["_id"]
    out = []
    for t in _db()["ganga_threads"].find({"members": me}).sort("updated_at", -1).limit(50):
        last = _db()["ganga_letters"].find({"thread": t["_id"]}).sort("created_at", -1).limit(1)
        last = next(iter(last), None)
        read = (t.get("last_read") or {}).get(str(me), datetime.min)
        out.append({
            "id": str(t["_id"]), "with": _name_of(_other(t, me)), "diya_text": t.get("diya_text", ""),
            "updated_at": t["updated_at"], "last": last["text"][:140] if last else "",
            "unread": t.get("last_sender") != me and t["updated_at"] > read, "closed": t.get("closed", False),
        })
    return out


@router.get("/threads/{thread_id}")
def thread(thread_id: str, user: dict = Depends(require_user)):
    me = user["_id"]
    t = _my_thread(thread_id, user)
    _db()["ganga_threads"].update_one({"_id": t["_id"]}, {"$set": {f"last_read.{me}": datetime.utcnow()}})
    letters = _db()["ganga_letters"].find({"thread": t["_id"]}).sort("created_at", 1)
    return {
        "id": str(t["_id"]), "with": _name_of(_other(t, me)), "diya_text": t.get("diya_text", ""), "closed": t.get("closed", False),
        "letters": [{"id": str(l["_id"]), "mine": l["sender"] == me, "text": l["text"], "created_at": l["created_at"]} for l in letters],
    }


@router.post("/threads/{thread_id}/letters")
def send_letter(thread_id: str, data: LetterIn, user: dict = Depends(require_user)):
    me = user["_id"]
    t = _my_thread(thread_id, user)
    if t.get("closed") or _other(t, me) in _blocked_between(me):
        _reject("closed")
    reason = check(data.text, "letter")
    if reason:
        _reject(reason)
    _letter_quota(user)
    now = datetime.utcnow()
    _db()["ganga_letters"].insert_one({"thread": t["_id"], "sender": me, "text": data.text.strip(), "created_at": now})
    _db()["ganga_threads"].update_one({"_id": t["_id"]}, {"$set": {"updated_at": now, "last_sender": me, f"last_read.{me}": now}})
    return {"ok": True}


@router.post("/threads/{thread_id}/block")
def block(thread_id: str, user: dict = Depends(require_user)):
    """Block the other sadhak: the thread closes and neither will meet the other's diyas again."""
    me = user["_id"]
    t = _my_thread(thread_id, user)
    other = _other(t, me)
    _db()["ganga_blocks"].update_one({"user": me, "blocked": other},
                                     {"$setOnInsert": {"user": me, "blocked": other, "created_at": datetime.utcnow()}}, upsert=True)
    _db()["ganga_threads"].update_one({"_id": t["_id"]}, {"$set": {"closed": True}})
    return {"ok": True}


@router.post("/threads/{thread_id}/report")
def report_thread(thread_id: str, data: GangaReportIn, user: dict = Depends(require_user)):
    me = user["_id"]
    t = _my_thread(thread_id, user)
    _db()["ganga_reports"].insert_one({"kind": "thread", "target": t["_id"], "author": _other(t, me), "reporter": me,
                                       "reason": data.reason, "created_at": datetime.utcnow(), "status": "open"})
    return block(thread_id, user)


# ──────────────────────────────────────────────────────────────────────────────
# Moderation (admin)
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/admin/reports", dependencies=[Depends(require_admin)])
def open_reports():
    """Open reports with the reported text, newest first."""
    db, out = _db(), []
    for r in db["ganga_reports"].find({"status": "open"}).sort("created_at", -1).limit(100):
        if r["kind"] == "diya":
            d = db["ganga_diyas"].find_one({"_id": r["target"]}) or {}
            text = d.get("text", "")
        else:
            text = "\n".join(l["text"] for l in db["ganga_letters"].find({"thread": r["target"], "sender": r["author"]}).limit(10))
        out.append({"id": str(r["_id"]), "kind": r["kind"], "reason": r["reason"], "author": _name_of(r["author"]),
                    "text": text, "created_at": r["created_at"]})
    return out


@router.post("/admin/reports/{report_id}", dependencies=[Depends(require_admin)])
def resolve_report(report_id: str, action: str = "dismiss"):
    """`remove` takes the diya off the river (or closes the thread); `ban` also removes all the writer's diyas."""
    db = _db()
    r = db["ganga_reports"].find_one({"_id": _oid(report_id)})
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    if action in ("remove", "ban"):
        if r["kind"] == "diya":
            db["ganga_diyas"].update_one({"_id": r["target"]}, {"$set": {"status": "removed"}})
        else:
            db["ganga_threads"].update_one({"_id": r["target"]}, {"$set": {"closed": True}})
    if action == "ban":
        db["ganga_diyas"].update_many({"author": r["author"]}, {"$set": {"status": "removed"}})
        db["ganga_profiles"].update_one({"_id": r["author"]}, {"$set": {"banned": True}})
    db["ganga_reports"].update_one({"_id": r["_id"]}, {"$set": {"status": action, "resolved_at": datetime.utcnow()}})
    return {"ok": True}
