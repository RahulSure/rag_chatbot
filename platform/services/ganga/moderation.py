"""
Checks every diya and letter before anyone else sees it.

Strangers write to strangers here, so the rules are strict: no way to move off the
platform (numbers, links, handles, payment apps), no asking for or offering money,
nothing sexual or abusive, no practices aimed at controlling another person. A
message that sounds like someone in danger is never floated; the writer is shown
help instead. Rule-based on purpose: fast, free and predictable.
"""

from __future__ import annotations

import re

_CONTACT = re.compile(
    r"(?:\+?\d[\s\-().]?){8,}"                      # phone numbers
    r"|[\w.+-]+@[\w-]+\.[\w.]+"                     # email addresses
    r"|https?://|www\.|\b[\w-]+\.(?:com|in|org|net|me|io|co|ly)\b"
    r"|(?<!\w)@[A-Za-z0-9_.]{3,}",                  # social handles
    re.I,
)
_OFF_PLATFORM = re.compile(
    r"(?i)\b(?:whats\s?app|wa\.me|telegram|insta(?:gram)?|snapchat|facebook|messenger|signal app|"
    r"my number|call me|dm me|text me)\b|व्हाट्सएप|मेरा नंबर|कॉल करो|कॉल करें"
)
_MONEY = re.compile(
    r"(?i)\b(?:upi|paytm|g\s?pay|phonepe|bank account|ifsc)\b"
    r"|\b(?:send|transfer|give|pay|lend)\b[^.?!]{0,20}\b(?:money|rupees|rs\.?|₹|cash|fees?)\b"
    r"|(?:₹|\brs\.?|\binr)\s?\d|\b\d+\s?(?:rupees|rs)\b"
    r"|\b(?:fees?|charges?|paid)\b[^.?!]{0,20}\b(?:puja|remedy|remedies|reading|sadhana|ritual|consultation)\b"
    r"|पैसे भेज|रुपये भेज|फीस"
)
_SEXUAL = re.compile(
    r"(?i)\b(?:sex|sexy|nude|nudes|naked|horny|porn|boobs|dick|pussy|hookup|sexting|xxx)\b|सेक्स|नंगी|नंगा"
)
_ABUSE = re.compile(
    r"(?i)\b(?:fuck|fucking|bitch|bastard|slut|whore|asshole|madarchod|behenchod|bhenchod|chutiya|randi|harami)\b"
    r"|मादरचोद|बहनचोद|चूतिया|रंडी|हरामी"
)
# Influence rituals aimed at a particular person ("vashikaran on my ex").
_CONTROL = re.compile(r"(?i)vashikaran|vashikarn|वशीकरण|mohan mantra|मोहन मंत्र|sammohan|सम्मोहन")
_TARGET = re.compile(r"(?i)\b(?:him|her|my ex|my boss|someone|a girl|a boy|that person|my crush)\b|उसे|उसको|उसका|किसी को|प्रेमी|प्रेमिका")
_CRISIS = re.compile(
    r"(?i)suicid|kill myself|end my life|end it all|want to die|don'?t want to live|self[- ]?harm|cut myself|no reason to live"
    r"|आत्महत्या|खुदकुशी|मर जाना चाहत|मरना चाहत|जीना नहीं चाहत|जान दे दूँ|जान दे दूं"
)

LIMITS = {"diya": (20, 600), "letter": (1, 1000)}


def check(text: str, kind: str = "diya") -> str | None:
    """None when the text may be sent; otherwise a reason code the app explains to the writer."""
    low, high = LIMITS[kind]
    stripped = text.strip()
    if len(stripped) < low:
        return "too_short"
    if len(stripped) > high:
        return "too_long"
    if _CRISIS.search(stripped):
        return "crisis"
    if _CONTACT.search(stripped) or _OFF_PLATFORM.search(stripped):
        return "contact"
    if _MONEY.search(stripped):
        return "money"
    if _SEXUAL.search(stripped):
        return "sexual"
    if _ABUSE.search(stripped):
        return "abuse"
    if _CONTROL.search(stripped) and _TARGET.search(stripped):
        return "control"
    return None


def check_name(name: str) -> str | None:
    """A pen name can't carry contact details, money talk, or anything crude."""
    stripped = " ".join(name.split())
    if not 2 <= len(stripped) <= 24:
        return "name"
    for pattern in (_CONTACT, _OFF_PLATFORM, _MONEY, _SEXUAL, _ABUSE):
        if pattern.search(stripped):
            return "name"
    if any(ch.isdigit() for ch in stripped) and sum(ch.isdigit() for ch in stripped) > 3:
        return "name"
    return None
