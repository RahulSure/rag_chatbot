"""
Shared Pydantic schemas used across apps/api and services.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
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


class VectorStoreHealth(BaseModel):
    status: str
    vector_store_docs: int
    model: str
    last_ingestion: Optional[datetime] = None
