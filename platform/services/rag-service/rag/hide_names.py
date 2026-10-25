"""
Remedy sources (switch words, flower remedies, Reiki) are presented without
naming the person who taught or wrote them, and without their site addresses.
Applied when pages are stored, to what is already stored, and to every answer.
"""

from __future__ import annotations

import re

# Every link and email address in these posts points back to the teacher.
_SITE_LINKS = re.compile(r"https?://[^\s)\]]+|www\.[^\s)\]]+|[\w.+-]+@[\w-]+\.[\w.]+|\b[\w-]*(?:naran|lotus)[\w-]*\.(?:com|org|in|net)\b[^\s)\]]*", re.I)
_SITE_NAMES = re.compile(r"(?i)\breach\s?on\s?naran\b|\breachnaran\b|\breach\s?lotus\b|\bnaransevents\b")
# A byline on its own line: "Naran S Balakumar".
_BYLINE = re.compile(r"(?im)^[ \t]*(?:sri[ \t]+)?naran(?:[ \t]+s\.?)?[ \t]*balakumar[ \t]*:?[ \t]*$\n?")
# A speaker label in the question-and-answer posts: "Naran, June 15th".
_SPEAKER = re.compile(r"(?im)^([ \t]*)(?:sri[ \t]+)?naran(?:ji)?(?:[ \t]+(?:s\.?[ \t]*)?balakumar)?(?:[ \t]+(?:sri|sir|ji))?(?=[ \t]*[,:\-–])")
_NAME = re.compile(
    r"(?i)\b(?:sri\s+)?naran(?:ji|garu|sir|s)?\b(?:\s+s(?:\.|\b))?(?:\s+balakumar)?(?:\s+(?:sri|sir|ji|garu)\b)?(?:['’]s)?"
    r"|\bbalakumar\b(?:['’]s)?"
    r"|नारन(?:\s*जी)?"
)
_SENTENCE_START = re.compile(r"(^|[.!?]\s+|\n\s*)the teacher")
# Any sentence of an answer that still names the teacher is dropped.
_NAMING_SENTENCE = re.compile(r"[^.!?।\n]*(?:\b(?:naran(?:ji|garu|sir|s)?|balakumar)\b|नारन)[^.!?।\n]*[.!?।]?", re.I)


def hide_names(text: str) -> str:
    """Replace the teacher's name with "the teacher" and drop bylines and site links."""
    text = _SITE_LINKS.sub("", text)
    text = _SITE_NAMES.sub("the site", text)
    text = _BYLINE.sub("", text)
    text = _SPEAKER.sub(r"\1Reply", text)
    text = _NAME.sub(lambda m: "the teacher's" if m.group(0).endswith(("'s", "’s")) else "the teacher", text)
    return _SENTENCE_START.sub(lambda m: f"{m.group(1)}The teacher", text)


def clean_title(title: str) -> str:
    """"Naran Sri's This Week Chanting" -> "This Week Chanting"; "Ask Naran: X" -> "X"."""
    t = re.sub(r"(?i)^\s*(?:sri\s+)?naran(?:ji)?(?:\s+(?:sri|sir|ji))?['’]s\s+", "", title)
    t = re.sub(r"(?i)^\s*ask\s+naran\s*[:\-–]?\s*", "", t)
    t = hide_names(t).strip(" -–:")
    return (t[:1].upper() + t[1:]) if t else "Switch words"


def drop_naming_sentences(answer: str) -> str:
    """Last safeguard for answers: remove any sentence that names the teacher."""
    cleaned = _NAMING_SENTENCE.sub("", answer)
    return re.sub(r"[ \t]{2,}", " ", re.sub(r"\n{3,}", "\n\n", cleaned)).strip()
