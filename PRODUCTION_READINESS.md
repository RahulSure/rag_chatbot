# Production Readiness — Shrimali AI RAG Chatbot

Gap analysis + fixes for productionizing the platform (backend, frontend, MongoDB,
deployment). Companion to [docs/PRODUCTION_PLAN.md](docs/PRODUCTION_PLAN.md).

**Status: production-ready for the target workload (20–25 users/day, 1–2 messages each),
pending the two owner action items in §7.**

Date of this pass: 2026-07-11. Verified against a live API (port 8001) with in-process
Redis (`REDIS_FAKE=1`) and the real MongoDB Atlas cluster (625 chunks across 3 books).

---

## 1. Headline: the chatbot now switches books and carries context

The core feature — automatic, book-aware context switching with conversation memory —
was rebuilt. Below is the same 12-scenario conversation run against the code **before**
and **after** the change. "Sources" = which book the cited passages came from.

| # | Turn (one session) | Before (baseline) | After | 
|---|---|---|---|
| T1 | "अप्सरा साधना कैसे शुरू करें?" | mixed / wrong book | **apsara-sadhna** ✓ |
| T2 | "uska mantra kya hai?" | **Mantra Rahasya** (wrong) | rewritten → "अप्सरा साधना का मंत्र क्या है?", **apsara-sadhna** ✓ |
| T3 | "isme kitne din lagte hain?" | wrong | rewritten → "अप्सरा साधना में कितने दिन लगते हैं?", **apsara-sadhna** ✓ |
| T4 | "Saundarya book mein … upay?" | **Apsara Sadhna** (ignored explicit book) | **saundarya** ✓ |
| T5 | "iske liye koi mantra bhi bataya hai kya?" | wrong | **mantra-rahasya** ⚠️ (see §6 — "mantra" ambiguity) |
| T6 | "saundarya aur apsara sadhna dono mein…?" | single book | **both books**, each attributed ✓ |
| T7 | "मन्त्र रहस्य में यंत्र…?" | wrong | **mantra-rahasya** ✓ |
| T8 | "गुरु दीक्षा क्यों ज़रूरी है?" (fresh topic) | inherited prev book | **no inherited filter** — context dropped ✓ |
| T9 | "वापस अप्सरा वाली बात पर, उर्वशी साधना का समय?" | wrong | rewritten → "उर्वशी साधना का समय क्या है?", **apsara-sadhna** ✓ |
| T11 | pin saundarya, then ask about mantra rahasya | n/a | pin wins → **saundarya** ✓ |
| T10 | no session → follow-up | n/a | **HTTP 200**, no crash (degrades gracefully) ✓ |

**11 / 12 scenarios pass.** The one miss (T5) is a genuine word/​book-name ambiguity, documented in §6.

Before, the `/query/filtered` book filter was silently ignored, session memory truncated
answers to 200 chars, and no book routing existed. Concretely: the exact 5 Apsara questions
you asked earlier retrieved **0/12 sources from the right book** on the first three; after
this work they retrieve 12/12 (see `data/apsara_questions_answers.md`).

### How it works now (per turn)
1. Load session (Redis) → prior turns, active book, manual pin.
2. Route: **manual pin** > **zero-latency alias heuristic** (turn 1) > **one LLM "condense+route" call** (when there's history) > **deterministic fallback** if the LLM fails.
3. The LLM rewrites the message into a standalone question (resolving "uska/isme/…") AND picks the book(s). Book names in Hindi or roman both resolve (aliases stored in Mongo).
4. Retrieve book-scoped (`book_slug` equality, or `$in` for multi-book compares); if a filtered search returns nothing, retry unfiltered so the user still gets an answer.
5. Answer with a single-book or multi-book prompt (the latter attributes each claim to its book).
6. Save the turn (full-ish answer, standalone question, books) with a sliding 1-hour TTL.

New/changed files: `rag/router.py` (new), `apps/api/services/conversation.py` (new),
`rag/query_engine.py` (shared-components split + `$in` filters + multi-book prompt +
`answer_query`), `routers/query.py` (rewritten handlers), `llm/krutrim_llm.py` (per-call
timeout, retry, raises on failure), `packages/shared/schemas.py` (additive fields).

---

## 2. Silent production breakers — fixed

| Finding | Impact before fix | Fix |
|---|---|---|
| 5 routers hardcoded `db["embeddings"]` while prod collection is `books` | `/books`, `/topics`, `/daily-wisdom`, `/analytics/stats`, `/admin/books` all returned empty/fallback data | Centralized `get_collection()` in `deps.py`; all routers use it. Verified: `/books` now lists all 3 books, `/analytics/stats` shows 625 chunks, `/topics` shows real counts |
| Book metadata missing from the `_node_content` blob on 450 old chunks | Citations showed `book: null` for Saundarya & Mantra Rahasya | Backfilled `_node_content` — all 625 chunks now cite the correct book |
| `_handle_filtered` dropped conversation history | Book-pinned queries lost memory | Filtered path now condenses against history |
| Session answers truncated to 200 chars in history | Long Hindi answers corrupted follow-ups | Session v2 stores ~600 chars, renders ~300 to the router |
| LLM errors returned **as the answer text** | API failures persisted as "assistant" turns; users saw `Request error: …` as a reply | `krutrim_llm` now retries once and **raises**; handlers return HTTP 502 |
| `.env.example` / code defaults said `saundarya`/`embeddings` | New deployments pointed at the wrong DB/collection | Aligned to `dr-narayan-dutt`/`books`; added missing `ADMIN_SECRET`, `REDIS_URL`, `CELERY_*`, `CORS_ORIGINS` |

---

## 3. Security & hardening

| Item | Status |
|---|---|
| Live GitHub PAT (`ghp_…`) sitting in `data/github_token` | **Deleted from disk.** ⚠️ Owner must still revoke it — see §7 |
| Admin auth used a non-constant-time `!=` compare | Now `secrets.compare_digest` |
| CORS defaulted to `*` with all methods/headers | Now an explicit origin list from `CORS_ORIGINS`, methods/headers scoped |
| Real secrets (Atlas URI w/ password, Krutrim key, HF token) in untracked `.env` | Not in git history; **rotate recommended** — §7 |
| Prometheus counters defined but never incremented | Wired into request middleware (route-templated to bound cardinality); `/metrics` now reports real data |

---

## 4. Repo cleanup

- Removed dead code: legacy top-level `api/` (old ChromaDB FastAPI), `query_all.py`, `test.py` (loaded the wrong 384-dim model), `answers.txt`, `starter.md`.
- Removed junk: `chroma_db/` (unused), `toaz.info-*.pdf`, stray `.DS_Store` and `__pycache__`.
- Untracked-but-kept (were committed by mistake): 24 `data/` text files, `public/videos/teaching-3.mp4`.
- `README.md` rewritten (was documenting ChromaDB; reality is MongoDB Atlas). `SETUP.md` remains authoritative.
- `mongodb_vector_index.json` updated to match the live Atlas index (now includes `book_slug`, `topic`, `language` filter fields — these were added to the live index during this work).
- Root `requirements.txt` fixed: added `redis`, `easyocr`, `python-multipart`; dropped `pytesseract`.

---

## 5. Frontend — video weight & lazy loading

The home hero carousel shipped **8.1 MB of video, all three eagerly in the DOM.**

- **Compressed** (ffmpeg, H.264 CRF 32, faststart, dropped silent data track): 8.1 MB → **1.6 MB total** (712K/480K/212K + posters). Originals archived to `data/archive/videos_original/`.
- **Lazy loading**: each `<video>` now gets its `src` only after the carousel scrolls into view (IntersectionObserver) and only for the active slide; inactive slides show a poster JPEG with `preload="none"`. Playback and auto-advance pause when the carousel is off-screen.
- The hero is intentionally kept server-rendered (poster paints instantly) rather than `next/dynamic ssr:false`, which would blank the hero and hurt LCP.
- Fixed while there: added the missing `/books` page (nav + sitemap linked to a 404); removed dead `createStreamingQuery`; removed the unused `/api/v1` rewrite; `ArticleCard` image is `loading="lazy"`; **added `output: "standalone"`** to `next.config.ts` — the web Dockerfile already assumed it, so the image build was latently broken; fixed the web Dockerfile to use **Yarn** (it used `npm ci` but the repo commits `yarn.lock`).
- `yarn build` passes (12 routes, standalone `server.js` produced).

### Mobile responsiveness — Playwright audit

Drove every route through headless Chromium at **320 / 375 / 390 / 768 px** (iPhone SE-min,
SE, iPhone 12, tablet), checking page-level scroll width **and** every element's real geometry
(`getBoundingClientRect`, so it catches spill even under `overflow:hidden`), plus full-page
screenshots.

- **8 routes × 4 viewports = 0 page-level horizontal overflow.** Home, Books, Chat, Guru, Search, Teachings, Blog, Admin-gate all fit with nothing spilling.
- **Chat exercised interactively** — sent a real question, waited for the streamed answer + inline citation + Copy/WhatsApp actions to render, re-checked at 320/375: clean, long Hindi text wraps correctly.
- **Found & fixed: Admin dashboard tab bar overflow.** `Overview / Articles / Upload Book / Analytics` was ~489 px wide in a 320 px viewport with no overflow handling — "Upload Book" was sliced and "Analytics" was off-screen and unreachable. Fixed with `overflow-x-auto` + non-shrinking `whitespace-nowrap` tabs and tighter mobile padding (a swipeable tab bar). Re-audited: all four tabs reachable, upload form fully responsive.
- **Found & fixed: chat page layout/scroll UX** (reported by the owner; the horizontal-overflow pass had missed these). (a) The chat card was pinned to `min-h-[600px]` with a `flex-1 h-full` message area, so a short answer left a large empty void below the input — now the card sizes to content (600 px → ~345 px), message area grows to a `max-h-[62vh]` then scrolls internally. (b) Navigating to *AI Chat* auto-scrolled the whole page down because `scrollIntoView` on the bottom sentinel scrolled every ancestor including the window — now only the message container's `scrollTop` is set, so the window never jumps. Verified: `scrollY == 0` on load at desktop and mobile.

---

## 6. Known limitations

- **T5 "iske liye koi mantra bhi bataya hai kya?" routes to Mantra Rahasya, not Saundarya.** The word "mantra" is both a common Hindi word and the name of a book, so the LLM (and a human) can reasonably read this as "the Mantra Rahasya book". Mitigation: users can pin a book; a larger router model would help. Not a crash — the answer is still grounded, just in the other book.
- **Routing depends on the Krutrim LLM and is not 100% deterministic** for ambiguous follow-ups. Turn-1 book detection (roman *and* Devanagari names) is deterministic via the alias heuristic. The deterministic fallback guarantees the system never does worse than unfiltered retrieval.
- **Multi-worker Prometheus**: `/metrics` is per-worker. With `--workers 2` you'd want a multiprocess registry; fine for a single-worker VPS.
- **`docker compose up` was not run locally** — the machine's Docker runtime (colima) would not start and the `docker compose` v2 subcommand is absent. The compose YAML validates (`docker-compose config`, 5 services), the web Dockerfile bug was fixed, and every service's app was exercised directly. Full compose bring-up should be validated on the deploy host.

---

## 7. Owner action items (before / at deploy)

1. **Revoke the leaked GitHub token** (it was `ghp_…`, now deleted from disk but the token is still live): GitHub → Settings → Developer settings → Personal access tokens → revoke.
2. **Rotate the other secrets** currently in `.env` (Atlas password, `KRUTRIM_API_KEY`, `HF_TOKEN`, `LLAMA_CLOUD_API_KEY`) and set a strong `ADMIN_SECRET`. `.env` is gitignored (not in history), so no history rewrite is needed.
3. On the deploy host: set `CORS_ORIGINS` to the real site origin and **do not** set `REDIS_FAKE` (that flag is a local-dev-only, in-process Redis stand-in).

---

## 8. Deployment recommendation (DigitalOcean)

Workload ≈ 25–50 chat queries/day. LLM (Krutrim) and DB (Atlas) are external; the only
heavy local component is the embedding model (~2–2.5 GB RSS with torch). **RAM is the
constraint, not CPU — CPU-Optimized droplets are unnecessary.**

- **Start: Basic 4 GB / 2 vCPU / 80 GB — $24/mo.** Runs `api + web + redis`. Skip the Celery `worker`/`beat` initially; keep book ingestion local (upsert to Atlas from your Mac, as done today).
- **Upgrade in place to Basic 8 GB / 4 vCPU — $48/mo** if you enable the article worker or do on-server ingestion (EasyOCR + embeddings need ~2–3 GB more).
- Also: 2 GB swap, Docker + docker-compose via cloud-init, Caddy/nginx for TLS in front of web:3000 & api:8000, DO firewall open only on 80/443.

---

## 9. MongoDB review

- Collections: `books` (625 vector chunks), `query_logs` (102), `articles` (2).
- Metadata completeness: `book_slug`, `book`, `language`, `topic`, `book_aliases`, `_node_content` all **100% present** across 625 chunks.
- Indexes created: `query_logs` on `timestamp` (desc) and `session_id`; `articles` unique on `slug` and on `status`; `books` on `metadata.book_slug`.
- Atlas Vector Search index `vector_index` (768-dim cosine) filter fields: `page`, `chapter_number`, `chapter_title`, `section_type`, `book_slug`, `topic`, `language` — status READY.
