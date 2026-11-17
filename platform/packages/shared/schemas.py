"""
Shared Pydantic schemas used across apps/api and services.
"""

from __future__ import annotations

from datetime import date as date_type, datetime, time as time_type
from typing import Literal, Optional
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────────────────────
# RAG / Query
# ──────────────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int = Field(12, ge=1, le=20)
    stream: bool = Field(False)
    session_id: Optional[str] = Field(None, description="For session memory")


class FilteredQueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int = Field(12, ge=1, le=20)
    stream: bool = Field(False)
    session_id: Optional[str] = None
    book_slug: Optional[str] = None
    topic: Optional[str] = None
    language: Optional[str] = None


class SourceNode(BaseModel):
    page: Optional[int] = None
    book: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    text_snippet: str
    url: Optional[str] = None  # set for web-article sources


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceNode]
    model: str
    session_id: Optional[str] = None
    suggested_questions: list[str] = []


# ──────────────────────────────────────────────────────────────────────────────
# Books
# ──────────────────────────────────────────────────────────────────────────────

class BookMeta(BaseModel):
    slug: str
    name: str
    language: str
    author: str = "Dr. Narayan Dutt Shrimali"
    tags: list[str] = []
    chunk_count: int = 0
    ingested_at: Optional[datetime] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Topics
# ──────────────────────────────────────────────────────────────────────────────

class TopicResponse(BaseModel):
    slug: str
    label: str
    label_hi: str
    description: Optional[str] = None
    chunk_count: int = 0
    article_count: int = 0
    icon: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Articles
# ──────────────────────────────────────────────────────────────────────────────

class FAQItem(BaseModel):
    question: str
    answer: str


class ArticleResponse(BaseModel):
    id: str
    slug: str
    title: str
    meta_description: str
    body_mdx: str
    faq: list[FAQItem] = []
    tags: list[str] = []
    topic: str
    source_books: list[str] = []
    status: str  # draft | approved | published
    created_at: datetime
    published_at: Optional[datetime] = None
    seo_score: Optional[float] = None
    cover_image_url: Optional[str] = None
    language: str = "en"  # en | hi


class ArticleListItem(BaseModel):
    id: str
    slug: str
    title: str
    meta_description: str
    tags: list[str] = []
    topic: str
    status: str
    published_at: Optional[datetime] = None
    cover_image_url: Optional[str] = None
    language: str = "en"  # en | hi


class ArticleGenerateRequest(BaseModel):
    topic: str
    primary_keyword: str
    book_slugs: list[str] = []
    language: str = "en"


class ArticleApproveRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|published|rejected)$")


# ──────────────────────────────────────────────────────────────────────────────
# Daily Wisdom
# ──────────────────────────────────────────────────────────────────────────────

class DailyWisdom(BaseModel):
    text: str
    book: Optional[str] = None
    page: Optional[int] = None
    chapter: Optional[str] = None
    language: str = "hi"
    date: str  # YYYY-MM-DD


# ──────────────────────────────────────────────────────────────────────────────
# Search
# ──────────────────────────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    text_snippet: str
    book: Optional[str] = None
    page: Optional[int] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    score: Optional[float] = None


# ──────────────────────────────────────────────────────────────────────────────
# Analytics
# ──────────────────────────────────────────────────────────────────────────────

class TrendingQuery(BaseModel):
    query: str
    count: int
    language: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Admin / Ingestion
# ──────────────────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    skip_ocr: bool = False
    force: bool = False
    book_name: str = "Saundarya"
    book_slug: str = "saundarya"
    language: str = "hi"
    tags: list[str] = ["spiritual", "sadhana"]


class IngestResponse(BaseModel):
    status: str
    message: str


# ──────────────────────────────────────────────────────────────────────────────
# Astrology
# ──────────────────────────────────────────────────────────────────────────────

class BirthDetails(BaseModel):
    date: date_type = Field(..., description="Birth date at the birthplace (YYYY-MM-DD)")
    time: time_type = Field(..., description="Local clock time of birth (HH:MM)")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    tz: str = Field(..., description="IANA time zone of the birthplace, e.g. Asia/Kolkata")
    place: Optional[str] = None


class MatchRequest(BaseModel):
    groom: BirthDetails
    bride: BirthDetails


class DayRequest(BaseModel):
    birth: BirthDetails
    # Where the visitor is today (for sunrise); the birthplace when left out.
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    tz: Optional[str] = None


class VarshaphalRequest(DayRequest):
    year: int = Field(..., ge=1900, le=2100)


class VectorStoreHealth(BaseModel):
    status: str
    vector_store_docs: int
    model: str
    last_ingestion: Optional[datetime] = None


# ──────────────────────────────────────────────────────────────────────────────
# Accounts (Google sign-in)
# ──────────────────────────────────────────────────────────────────────────────

class GoogleLoginRequest(BaseModel):
    credential: str = Field(..., min_length=1, description="Google ID token from Google Identity Services")


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None


class ProfileData(BaseModel):
    """Per-user data mirrored from the browser's localStorage. Shapes are owned by the web app."""
    birth: Optional[dict] = None
    place: Optional[dict] = None
    japa: Optional[dict] = None
    updated_at: Optional[datetime] = None


class ConversationSummary(BaseModel):
    id: str
    title: str
    updated_at: datetime
    turn_count: int


class ConversationTurn(BaseModel):
    q: str
    a: str
    sources: list[SourceNode] = []
    suggested: list[str] = []
    ts: Optional[datetime] = None


class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    turns: list[ConversationTurn]


# ──────────────────────────────────────────────────────────────────────────────
# Ganga: diyas floated between sadhaks
# ──────────────────────────────────────────────────────────────────────────────

DIYA_KINDS = ("seeking", "sharing", "gratitude", "prayer", "partner")
GANGA_PRACTICES = ("japa", "meditation", "mantra", "bhakti", "yoga", "seva", "jyotish", "tantra", "pranayama", "scripture")


class GangaBirth(BaseModel):
    """Birth details sent once to derive Moon sign, nakshatra and numerology; never stored."""
    date: date_type
    time: time_type
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    tz: str


class GangaProfileIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=24, description="Pen name shown to others")
    languages: list[Literal["en", "hi"]] = Field(..., min_length=1)
    practices: list[str] = Field(default_factory=list, max_length=6)
    adult: bool = Field(..., description="Confirms the person is 18 or older")
    accept_rules: bool
    birth: Optional[GangaBirth] = Field(None, description="Opt-in: match by kundli and numerology")
    tz: str = "Asia/Kolkata"


class DiyaIn(BaseModel):
    kind: Literal["seeking", "sharing", "gratitude", "prayer", "partner"]
    text: str = Field(..., max_length=2000)


class LetterIn(BaseModel):
    text: str = Field(..., max_length=2000)


class GangaReportIn(BaseModel):
    reason: Literal["unsafe", "abuse", "sexual", "money", "spam", "other"] = "other"
