# Productionize the RAG Chatbot Platform

## Context

The repo is a working prototype: 3 Hindi spiritual books ingested into MongoDB Atlas (625 vector chunks: saundarya 99, mantra-rahasya 351, apsara-sadhna 175), FastAPI backend (`platform/apps/api`), Next.js 16 frontend (`platform/apps/web`), Krutrim `gpt-oss-120b` LLM. The user wants to deploy on a **single VPS/EC2 with docker-compose** and needs: repo cleanup, video compression + lazy loading, **automatic book context-switching in the chatbot with conversation memory**, a MongoDB review, and an end-to-end test/gap report (`.md` deliverable).

Exploration found the prototype has silent production breakers: 5 routers hardcode the wrong Mongo collection name, session memory truncates answers and is dropped entirely on the filtered endpoint, no book routing exists, LLM failures are returned as answers, a live GitHub PAT sits in the working tree, and the homepage eagerly loads 8.4 MB of video.

## Deliverable 0 — Gap report (`PRODUCTION_READINESS.md`)

Write a gap-analysis markdown at repo root capturing everything below (findings → fix → status), plus results of simulated conversational test cases run against the live backend before and after changes. This is the document the user asked for; keep it updated as fixes land.

## Phase 1 — Security + repo cleanup

1. **Rotate + delete `data/github_token`** (real GitHub PAT, untracked but live on disk). Tell user to revoke it on GitHub.
2. Recommend rotating the Atlas password / Krutrim key / HF token in `.env` (real secrets in working tree; `.env` is untracked so no history rewrite needed).
3. Delete legacy/stale files (git rm): root `api/` (dead ChromaDB FastAPI), `query_all.py`, `test.py` (loads the *wrong* 384-dim model), `answers.txt`, `starter.md`.
4. Delete untracked junk: `chroma_db/` (2.4 MB, unused), `toaz.info-*.pdf` (3 MB junk download), root `.DS_Store`, stale `__pycache__` dirs.
5. Untrack-but-keep (git rm --cached): 24 `data/processed|archive` text files, `platform/apps/web/public/videos/teaching-3.mp4` (only tracked binary).
6. `data/video (3|6|7).mp4` are byte-identical originals of `public/videos/teaching-*.mp4` → delete the `data/` copies after compression (Phase 2).
7. Update `README.md` (still documents ChromaDB architecture; MongoDB Atlas is reality). Keep `SETUP.md` as authoritative; fold or delete `PLATFORM_CLEANUP.md` after executing its remaining items.
8. Update `mongodb_vector_index.json` to match the live Atlas index (live index already has `metadata.book_slug/topic/language` filter fields added this session; the repo file is stale).
9. Execute remaining `PLATFORM_CLEANUP.md` items: verify `platform/services/rag-service/rag/embeddings.py` uses mpnet-768 (not MiniLM-384), remove `pdf2image`/`pytesseract` from `platform/apps/api/requirements.txt`, remove tesseract from `api.Dockerfile`.
10. Root `requirements.txt`: add `redis`, `easyocr`, drop `pytesseract`; or make it defer to `platform/apps/api/requirements.txt`.

## Phase 2 — Frontend: video compression + lazy loading

Videos: 3 mp4s, 8.4 MB total, only used by `components/VideoCarousel.tsx` on the home page; all three `<video>` elements mount at once (`preload="auto"` for slide 0, `metadata` for others), no lazy loading anywhere.

1. **Compress with ffmpeg** (H.264 CRF 28 + `-movflags +faststart`, 720p max, strip audio if silent) → target ≤ 1 MB each (~85% reduction). Generate poster JPEGs (first frame) for instant paint. Keep originals in `data/archive/` locally, not in git.
2. **Lazy-load `VideoCarousel`**: `next/dynamic` import of the carousel (client-only, below-fold safe), `IntersectionObserver` inside the component so videos only get `src` when the carousel is near viewport; only the *active* slide gets `preload="auto"`, inactive slides `preload="none"` + poster.
3. Fix incidental frontend rot while there: dead `/books` nav link (`layout.tsx`, `Navbar.tsx`, `sitemap.ts` → either add `app/books/page.tsx` or remove links), dead `createStreamingQuery` in `lib/api.ts`, unused `/api/v1` rewrite in `next.config.ts`, `ArticleCard.tsx` raw `<img>` → `next/image` with `loading="lazy"`, tighten `images.remotePatterns` from wildcard, align `eslint-config-next` with Next 16.
4. `next.config.ts`: add `output: "standalone"` for the Docker deploy.
5. Verify `yarn build` passes (never verified in this session).

## Phase 3 — Backend correctness fixes (pre-requisite for chat feature)

1. **Collection-name bug**: replace hardcoded `db["embeddings"]` with `db[os.getenv("MONGODB_COLLECTION", "books")]` in `books.py:64,98`, `wisdom.py:41,46`, `analytics.py:54`, `admin.py:152`. Align `.env.example` + `deps.py`/`vector_store.py` defaults with real values (`dr-narayan-dutt`/`books`).
2. **Session memory**: remove `[:200]` answer truncation (query.py:43) — store full answer in Redis, truncate only at prompt-injection time if needed.
3. **`_handle_filtered` loses history** (query.py:153): inject session history same as sync path.
4. **LLM error handling** (`krutrim_llm.py:57,85,171`): raise instead of returning error text as answer; add 1 retry with backoff; surface 502 to client instead of persisting error strings as assistant turns.
5. `require_admin`: constant-time compare (`secrets.compare_digest`).
6. CORS: default to explicit origin list from env, not `*`.
7. Wire the defined-but-never-incremented Prometheus counters in `middleware.py`, or drop the `/metrics` endpoint.

## Phase 4 — Book-aware conversational context switching (core feature)

**Architecture: one "condense + route" LLM call per turn (only when history exists), with a zero-latency heuristic fast path, driving per-request retrieval filters.**

Per-turn pipeline for `POST /query`:
1. Load session v2 from Redis (turns, `active_books`, `pinned_book`); Redis absent → empty session, graceful.
2. Load **BookRegistry** — Mongo aggregate of distinct `book_slug` + names + topics + chapter titles, process-cached with 10-min TTL (no hardcoded book lists; new admin-uploaded books picked up automatically).
3. Route: pinned book wins → else if no history, heuristic alias match (dynamic, discriminative-token matching from registry; 0 ms) → else **one LLM call** `route_and_condense()` returning JSON `{standalone_question, book_slugs[], carry_context}` (temp=0, max_tokens=300, 10 s timeout). Condensation + routing must be one call: routing a follow-up ("uska mantra kya hai?") requires coreference resolution anyway.
4. Filters: 1 slug → EQ; ≥2 slugs → `FilterOperator.IN` (verified: installed `llama-index-vector-stores-mongodb` maps IN → Atlas `$in` pre-filter); none → unfiltered. Safety: 0 nodes with filter → retry once unfiltered; multi-book balance guard (supplemental `top_k=4` retrieval per missing book).
5. Synthesize with the standalone question as `query_str` (history NO LONGER prepended as flat text — fixes retrieval pollution). New `_MULTI_BOOK_RAG_PROMPT` for ≥2 books (attribute every claim to its book by name).
6. Save turn v2: `{q, sq (standalone), a (≤600 chars), books, ts}`, `active_books`, sliding 3600 s TTL, 10-turn / 16 KB caps. v1 sessions migrated on read.

Deterministic fallback when router LLM fails/times out/returns garbage: alias match → anaphor-word test + sticky `active_books` → unfiltered (never worse than today). Krutrim's return-error-as-text behavior explicitly checked (`Request error:` prefix) before JSON parse.

Pin interplay: `POST /query/filtered {book_slug}` sets `pinned_book` (explicit wins over auto-routing; `book_slug: null` clears). `_handle_filtered` gains condensation (fixes its existing history-loss bug). Response gains additive fields `routed_books`, `standalone_question` (existing clients unaffected). Streaming: router runs before SSE; emit an additive `data: [META:{"books":[...]}]` first frame (verify frontend skips unknown frames).

**Files:**
- NEW `platform/services/rag-service/rag/router.py` — BookRegistry (TTL cache + `invalidate_registry()`), `heuristic_route`, `route_and_condense` (+ `_ROUTER_PROMPT`), `fallback_route`, `RouteResult`.
- NEW `platform/apps/api/services/conversation.py` — session v2 store (load/save/pin, v1 migration, history renderer with `[books: ...]` tags); replaces `_get_session_history`/`_save_session_turn`.
- `rag/query_engine.py` — split into `_get_shared_components()` (`lru_cache(1)`: embed model, LLM, index, templates) + cheap per-request `build_query_engine(top_k, book_slugs, topic, language, streaming)`; `_build_metadata_filters` takes `book_slugs: list|None` EQ/IN; add multi-book prompt; keep old names as thin wrappers; removes the ~40-line sync/streaming duplication and the lru_cache(8) key-explosion problem.
- `llm/krutrim_llm.py` — honor per-call `timeout` kwarg (router 10 s vs answer 120 s).
- `routers/query.py` — rewrite 3 handlers around the pipeline.
- `packages/shared/schemas.py` — additive fields only.
- `routers/admin.py` — call `invalidate_registry()` after ingestion.

**Frontend follow-through:** chat UI gets an optional book pin dropdown (calls `/query/filtered`), shows "searching in <book>…" from the META frame, and displays `routed_books` on answers.

## Phase 5 — MongoDB review

1. Verify all 625 chunks have complete metadata (book_slug backfill was done this session — spot-check).
2. Index audit: `query_logs` needs index on `timestamp` (analytics sorts on it) + `session_id`; `articles` on `slug`+`status`.
3. Confirm Atlas vector index filter fields match `mongodb_vector_index.json` (after updating the file).
4. Review collections inventory: `books` (vectors), `query_logs`, `articles` — document in gap report.
5. Check `admin.py` `delete_book_vectors` + `/upload` paths use env collection (delete path already does).

## Phase 6 — E2E testing + deployment

1. Simulated conversational test suite (scripted against live API) — 12 scenarios proving context carry + switch, run before (baseline gaps) and after (verification). Highlights:
   - T1-3: "अप्सरा साधना कैसे शुरू करें?" → "uska mantra kya hai?" → "isme kitne din lagte hain?" (chained anaphors must stay in apsara-sadhna; T3 must resolve via T2's *stored standalone question*)
   - T4-5: explicit switch to Saundarya mid-conversation, then follow-up must anchor to Saundarya not the earlier apsara context
   - T6: cross-book compare ("saundarya aur apsara sadhna, beauty ke bare mein kya kehte hain?") → IN filter, both books cited distinctly
   - T8: fresh unrelated question ("गुरु दीक्षा क्यों ज़रूरी है?") must NOT inherit the previous book filter (context *dropping*)
   - T9: long-range switch-back ("वापस अप्सरा वाली बात पर…")
   - T10: Redis stopped → degraded but no 500s
   - T11: pin via /query/filtered overrides auto-routing; response `routed_books` shows mismatch
   - T12: router LLM blackholed → deterministic fallback answers within bounded latency
   - Acceptance per turn: routed books match expectation; all cited sources' book_slug ∈ routed set; regression: bare `POST /query` without session_id unchanged.
   Plus endpoint smoke tests for every router; capture pass/fail into `PRODUCTION_READINESS.md`.
2. `docker compose up` on the compose file (`api`, `web`, `worker`, `beat`, `redis`): verify each service starts, healthchecks pass, chat works end-to-end through the compose network with Redis-backed memory.
3. Verify degraded mode: stop Redis → chat still answers (no memory), no 500s.

### Hosting choice (DigitalOcean)

Workload: 20–25 daily users × 1–2 messages ≈ 25–50 chat queries/day. LLM (Krutrim) and MongoDB (Atlas) are external; the only heavy local component is the embedding model (~2–2.5 GB RSS with torch). RAM is the constraint, not CPU — **CPU-Optimized droplets are not needed** (dedicated CPU would idle 99.9% of the day and has smaller disks at higher price).

- **Recommended: Basic (shared CPU) 4 GiB / 2 vCPU / 80 GB SSD — $24/mo.** Runs `api + web + redis`; skip `worker`/`beat` (Celery article-gen) initially and keep doing book ingestion locally (as today, upserting to Atlas from the Mac).
- **Upgrade path: Basic 8 GiB / 4 vCPU — $48/mo** if enabling worker/beat or doing on-server ingestion (EasyOCR + embedding batches need ~2–3 GB extra). Droplets resize in place, so start at $24.
- Also provision: 2 GB swap (belt-and-braces for torch spikes), Docker + docker-compose via cloud-init, Caddy or nginx for TLS in front of web:3000/api:8000, DO firewall allowing 80/443 only.

## Verification

- `yarn build` + `docker compose build` pass.
- Scripted conversation suite passes (context carried, book switches detected).
- `/books`, `/topics`, `/daily-wisdom`, `/analytics/stats` return real data (not fallbacks).
- Home page network tab: no video bytes fetched until carousel scrolled into view; compressed sizes ≤ ~1 MB each.
- Gap report `PRODUCTION_READINESS.md` complete with before/after test results.
