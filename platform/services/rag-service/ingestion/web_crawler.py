"""
Polite web crawler for the sources in web_sources.py.

  - Discovers pages from sitemap.xml (recursing into sitemap indexes); falls
    back to following same-site links from the seed pages.
  - Obeys robots.txt and any Crawl-delay, waits between requests, one thread per site.
  - Extracts the main article text with trafilatura and saves one JSON file per
    page under data/web/<site>/ (gitignored). Re-runs skip pages already saved.

Usage (from platform/services/rag-service):
    python -m ingestion.web_crawler                     # all sites
    python -m ingestion.web_crawler --sites shreedham108 gurugamya
    python -m ingestion.web_crawler --max-pages 50      # quick trial
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import threading
import time
import urllib.robotparser
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urldefrag, urljoin, urlparse

import requests

from ingestion.web_sources import WEB_SOURCES, SOURCES_BY_SLUG

USER_AGENT = "SadhakAI-Indexer/1.0 (+https://github.com/RahulSure/rag_chatbot)"
DATA_DIR = Path(__file__).resolve().parents[4] / "data" / "web"
DEFAULT_DELAY = 1.0      # seconds between requests to the same site
MIN_TEXT_CHARS = 150     # skip near-empty pages (menus, tag lists)
MAX_LINK_DEPTH = 3       # only used when a site has no sitemap

_SKIP_EXT = re.compile(r"\.(jpe?g|png|gif|webp|svg|ico|pdf|mp3|mp4|wav|zip|rar|docx?|xlsx?|pptx?|css|js)$", re.I)
_SKIP_PATH = re.compile(
    r"/(tag|tags|category|author|feed|comments|wp-json|wp-admin|wp-login|wp-content|cart|checkout|my-account|search)(/|$)"
    r"|/page/\d+/?$|/search/label/",
    re.I,
)
_SKIP_QUERY = re.compile(r"(replytocom|share=|updated-max|updated-min|reverse-paginate|showComment|action=|s=)", re.I)


def _log(slug: str, msg: str) -> None:
    print(f"[crawl:{slug}] {msg}", flush=True)


def _normalise(url: str) -> str:
    url, _ = urldefrag(url)
    url = re.sub(r"[?&]m=1$", "", url)  # blogspot mobile duplicates
    return url.rstrip("/") if urlparse(url).path not in ("", "/") else url


def _same_site(a: str, b: str) -> bool:
    """example.com and www.example.com are the same site."""
    return a.lower().removeprefix("www.") == b.lower().removeprefix("www.")


def _is_candidate(url: str, netloc: str) -> bool:
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not _same_site(p.netloc, netloc):
        return False
    if _SKIP_EXT.search(p.path) or _SKIP_PATH.search(p.path) or _SKIP_QUERY.search(p.query):
        return False
    return True


def _language(text: str) -> str:
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return "en"
    devanagari = sum(1 for c in letters if "ऀ" <= c <= "ॿ")
    return "hi" if devanagari / len(letters) > 0.3 else "en"


def _page_path(slug: str, url: str) -> Path:
    return DATA_DIR / slug / f"{hashlib.sha1(url.encode()).hexdigest()[:16]}.json"


class SiteCrawler:
    def __init__(self, source: dict, max_pages: int | None = None):
        self.source = source
        self.slug = source["slug"]
        self.netloc = urlparse(source["base"]).netloc
        self.max_pages = max_pages
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        self.robots = urllib.robotparser.RobotFileParser()
        self.delay = DEFAULT_DELAY
        self._last_request = 0.0
        self.stats = {"saved": 0, "skipped_existing": 0, "too_short": 0, "blocked": 0, "errors": 0}

    # ── HTTP ────────────────────────────────────────────────────────────────
    def _get(self, url: str) -> requests.Response | None:
        wait = self.delay - (time.monotonic() - self._last_request)
        if wait > 0:
            time.sleep(wait)
        for attempt in range(3):
            try:
                self._last_request = time.monotonic()
                resp = self.session.get(url, timeout=30)
                if resp.status_code == 429 or resp.status_code >= 500:
                    time.sleep(5 * (attempt + 1))
                    continue
                return resp
            except requests.RequestException:
                time.sleep(3 * (attempt + 1))
        return None

    def _load_robots(self) -> None:
        resp = self._get(f"{self.source['base']}/robots.txt")
        lines = resp.text.splitlines() if resp is not None and resp.status_code == 200 else []
        self.robots.parse(lines)
        crawl_delay = self.robots.crawl_delay(USER_AGENT)
        if crawl_delay:
            self.delay = max(self.delay, float(crawl_delay))

    # ── Discovery ───────────────────────────────────────────────────────────
    def _sitemap_urls(self) -> list[str]:
        from bs4 import BeautifulSoup

        found: list[str] = []
        queue = deque([f"{self.source['base']}/sitemap.xml"])
        seen: set[str] = set()
        while queue:
            sm = queue.popleft()
            if sm in seen:
                continue
            seen.add(sm)
            resp = self._get(sm)
            if resp is None or resp.status_code != 200 or "<loc>" not in resp.text:
                continue
            soup = BeautifulSoup(resp.content, "xml")
            # Some sitemaps list relative paths ("/astrology"); resolve them against the sitemap URL.
            locs = [urljoin(sm, loc.get_text(strip=True)) for loc in soup.find_all("loc")]
            if soup.find("sitemapindex"):
                queue.extend(locs)
            else:
                found.extend(locs)
        return found

    def _link_urls(self) -> list[str]:
        """Breadth-first link discovery for sites without a sitemap."""
        from bs4 import BeautifulSoup

        found: list[str] = []
        seen: set[str] = set()
        queue = deque((_normalise(s), 0) for s in self.source["seeds"])
        while queue and (self.max_pages is None or len(found) < self.max_pages):
            url, depth = queue.popleft()
            if url in seen or not self.robots.can_fetch(USER_AGENT, url):
                continue
            seen.add(url)
            resp = self._get(url)
            if resp is None or resp.status_code != 200 or "html" not in resp.headers.get("content-type", ""):
                continue
            found.append(url)
            if depth >= MAX_LINK_DEPTH:
                continue
            for a in BeautifulSoup(resp.text, "lxml").find_all("a", href=True):
                nxt = _normalise(urljoin(url, a["href"]))
                if nxt not in seen and _is_candidate(nxt, self.netloc):
                    queue.append((nxt, depth + 1))
        return found

    def discover(self) -> list[str]:
        urls = self._sitemap_urls()
        method = "sitemap"
        if not urls:
            urls, method = self._link_urls(), "links"
        urls = [_normalise(u) for u in urls + list(self.source["seeds"])]
        unique = list(dict.fromkeys(u for u in urls if _is_candidate(u, self.netloc)))
        _log(self.slug, f"discovered {len(unique)} pages via {method}")
        return unique[: self.max_pages] if self.max_pages else unique

    # ── Fetch + extract ─────────────────────────────────────────────────────
    def _save_page(self, url: str) -> None:
        import trafilatura

        path = _page_path(self.slug, url)
        if path.exists():
            self.stats["skipped_existing"] += 1
            return
        if not self.robots.can_fetch(USER_AGENT, url):
            self.stats["blocked"] += 1
            return
        resp = self._get(url)
        if resp is None or resp.status_code != 200 or "html" not in resp.headers.get("content-type", ""):
            self.stats["errors"] += 1
            return

        resp.encoding = resp.apparent_encoding if not resp.encoding or resp.encoding.lower() == "iso-8859-1" else resp.encoding
        extracted = trafilatura.extract(
            resp.text,
            url=url,
            output_format="json",
            with_metadata=True,
            include_comments=False,
            include_tables=True,
            favor_recall=True,
        )
        data = json.loads(extracted) if extracted else {}
        text = (data.get("text") or "").strip()
        if len(text) < MIN_TEXT_CHARS:
            self.stats["too_short"] += 1
            return

        page = {
            "url": url,
            "site": self.slug,
            "site_name": self.source["name"],
            "title": (data.get("title") or "").strip(),
            "date": data.get("date"),
            "language": _language(text),
            "text": text,
            "content_hash": hashlib.sha1(re.sub(r"\s+", " ", text).encode()).hexdigest(),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(page, ensure_ascii=False, indent=1), encoding="utf-8")
        self.stats["saved"] += 1

    def run(self) -> dict:
        self._load_robots()
        urls = self.discover()
        for i, url in enumerate(urls, 1):
            try:
                self._save_page(url)
            except Exception as exc:  # one bad page must not stop the site
                self.stats["errors"] += 1
                _log(self.slug, f"error on {url}: {type(exc).__name__}: {exc}")
            if i % 50 == 0:
                _log(self.slug, f"{i}/{len(urls)} {self.stats}")
        _log(self.slug, f"done {self.stats}")
        return self.stats


def crawl(slugs: list[str] | None = None, max_pages: int | None = None) -> dict[str, dict]:
    sources = [SOURCES_BY_SLUG[s] for s in slugs] if slugs else WEB_SOURCES
    for s in sources:
        if s.get("skip_reason"):
            print(f"[crawl:{s['slug']}] skipped - {s['skip_reason']}")
    sources = [s for s in sources if not s.get("skip_reason")]
    results: dict[str, dict] = {}

    def worker(src: dict) -> None:
        results[src["slug"]] = SiteCrawler(src, max_pages).run()

    threads = [threading.Thread(target=worker, args=(s,), daemon=True) for s in sources]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Crawl registered web sources into data/web/")
    parser.add_argument("--sites", nargs="*", choices=list(SOURCES_BY_SLUG), help="Default: all sites")
    parser.add_argument("--max-pages", type=int, default=None, help="Cap pages per site (for trial runs)")
    args = parser.parse_args()

    results = crawl(args.sites, args.max_pages)
    print("[crawl] summary:")
    for slug, stats in results.items():
        print(f"  {slug:26} {stats}")


if __name__ == "__main__":
    main()
