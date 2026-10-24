"""
Ingest crawled web pages (data/web/<site>/*.json) into MongoDB Atlas.

Per site the run is idempotent: existing chunks with that `metadata.source_site`
are deleted before the fresh ones are inserted, so re-running never duplicates.
Book chunks are never touched.

Usage (from platform/services/rag-service):
    python -m ingestion.ingest_web                 # all crawled sites
    python -m ingestion.ingest_web --sites gurugamya shreedham108
    python -m ingestion.ingest_web --dry-run       # counts only, no DB writes
    python -m ingestion.ingest_web --remove taajmindpower   # delete a site's chunks
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlparse

from dotenv import load_dotenv

from ingestion.ingest import _infer_topic, chunk_documents
from ingestion.web_crawler import DATA_DIR
from ingestion.web_sources import SOURCES_BY_SLUG

load_dotenv()

# Metadata the embedding / LLM context should not see (noise, or URLs the model might parrot).
_HIDDEN_FROM_EMBED = ["source_url", "source_site", "source_type", "book_slug", "tags", "language", "fetched_at"]
_HIDDEN_FROM_LLM = ["source_url", "source_site", "source_type", "book_slug", "tags", "fetched_at"]


def _title_from_url(url: str) -> str:
    slug = Path(unquote(urlparse(url).path)).stem
    slug = re.sub(r"[-_]+", " ", slug).strip()
    return slug.title() if slug else url


def _fallback_title(page: dict) -> str:
    """URL slug, or the article's first line when the slug is Blogger's meaningless "blog-post_NN"."""
    from_url = _title_from_url(page["url"])
    if not re.match(r"^blog post", from_url, re.I):
        return from_url
    for line in page["text"].splitlines():
        line = line.strip()
        if 3 <= len(line) <= 120:
            return line
    return from_url


def load_site_documents(slug: str):
    """Load one site's pages as LlamaIndex Documents, skipping duplicate texts."""
    from llama_index.core import Document

    pages = [json.loads(p.read_text(encoding="utf-8")) for p in sorted((DATA_DIR / slug).glob("*.json"))]
    # Blog engines often give every page the site's own name as <title>; detect and replace it.
    title_counts = Counter(p["title"] for p in pages)
    generic_titles = {t for t, n in title_counts.items() if n > 3 and len(pages) > 5}

    seen_hashes: set[str] = set()
    documents = []
    for page in pages:
        if page["content_hash"] in seen_hashes:
            continue
        seen_hashes.add(page["content_hash"])
        title = page["title"] if page["title"] and page["title"] not in generic_titles else _fallback_title(page)
        doc = Document(
            text=page["text"],
            metadata={
                "book": page["site_name"],
                "book_slug": slug,
                "chapter_title": title,
                "language": page["language"],
                "tags": ["web", slug],
                "source_type": "web",
                "source_site": slug,
                "source_url": page["url"],
                "topic": _infer_topic(title),
                "fetched_at": page["fetched_at"],
            },
        )
        doc.excluded_embed_metadata_keys = _HIDDEN_FROM_EMBED
        doc.excluded_llm_metadata_keys = _HIDDEN_FROM_LLM
        documents.append(doc)
    return documents, len(pages)


def _collection():
    from rag.vector_store import MONGODB_COLLECTION, MONGODB_DB_NAME, _get_mongo_client

    return _get_mongo_client()[MONGODB_DB_NAME][MONGODB_COLLECTION]


def _articles_collection():
    from rag.answer import WEB_ARTICLES
    from rag.vector_store import MONGODB_DB_NAME, _get_mongo_client

    return _get_mongo_client()[MONGODB_DB_NAME][WEB_ARTICLES]


def remove_site(slug: str) -> int:
    _articles_collection().delete_many({"site": slug})
    return _collection().delete_many({"metadata.source_site": slug}).deleted_count


def store_articles(slug: str, documents) -> int:
    """Full article text keyed by URL, so answers can quote a whole article instead of fragments."""
    from pymongo import ReplaceOne

    ops = [
        ReplaceOne(
            {"_id": d.metadata["source_url"]},
            {
                "_id": d.metadata["source_url"],
                "site": slug,
                "site_name": d.metadata["book"],
                "title": d.metadata["chapter_title"],
                "language": d.metadata["language"],
                "text": d.text,
            },
            upsert=True,
        )
        for d in documents
    ]
    if ops:
        _articles_collection().bulk_write(ops, ordered=False)
    return len(ops)


def sync_titles(slug: str) -> int:
    """Copy each stored article's title onto its chunks (cheap; no re-embedding)."""
    from pymongo import UpdateMany

    ops = [
        UpdateMany({"metadata.source_url": a["_id"]}, {"$set": {"metadata.chapter_title": a["title"]}})
        for a in _articles_collection().find({"site": slug}, {"title": 1})
    ]
    return _collection().bulk_write(ops, ordered=False).modified_count if ops else 0


def ingest_site(slug: str, dry_run: bool = False, articles_only: bool = False) -> None:
    documents, page_count = load_site_documents(slug)
    if not documents:
        print(f"[ingest_web:{slug}] no crawled pages in {DATA_DIR / slug} - run the crawler first")
        return
    if articles_only:
        stored = store_articles(slug, documents)
        print(f"[ingest_web:{slug}] stored {stored} full articles, updated titles on {sync_titles(slug)} chunks")
        return
    nodes = chunk_documents(documents)
    for node in nodes:  # chunk nodes inherit the exclusions from their document
        node.excluded_embed_metadata_keys = _HIDDEN_FROM_EMBED
        node.excluded_llm_metadata_keys = _HIDDEN_FROM_LLM
    print(f"[ingest_web:{slug}] {page_count} pages -> {len(documents)} unique -> {len(nodes)} chunks")
    if dry_run:
        return

    from llama_index.core import Settings, StorageContext, VectorStoreIndex
    from rag.embeddings import get_embedding_model
    from rag.vector_store import get_vector_store

    Settings.embed_model = get_embedding_model()
    Settings.embed_batch_size = 32
    Settings.llm = None

    removed = remove_site(slug)
    if removed:
        print(f"[ingest_web:{slug}] removed {removed} previous chunks")
    VectorStoreIndex(nodes, storage_context=StorageContext.from_defaults(vector_store=get_vector_store()), show_progress=True)
    print(f"[ingest_web:{slug}] stored {len(nodes)} chunks and {store_articles(slug, documents)} full articles")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest crawled web pages into the vector store")
    parser.add_argument("--sites", nargs="*", choices=list(SOURCES_BY_SLUG), help="Default: every crawled site")
    parser.add_argument("--dry-run", action="store_true", help="Count pages and chunks without writing")
    parser.add_argument("--remove", metavar="SITE", choices=list(SOURCES_BY_SLUG), help="Delete a site's chunks and exit")
    parser.add_argument("--articles-only", action="store_true", help="Only (re)store full articles; no embedding")
    args = parser.parse_args()

    if args.remove:
        print(f"[ingest_web] removed {remove_site(args.remove)} chunks for {args.remove}")
        return

    slugs = args.sites or sorted(p.name for p in DATA_DIR.iterdir() if p.is_dir() and p.name in SOURCES_BY_SLUG)
    for slug in slugs:
        ingest_site(slug, dry_run=args.dry_run, articles_only=args.articles_only)


if __name__ == "__main__":
    main()
