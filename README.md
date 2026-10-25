# Sadhak.ai — AI Spiritual Companion

An AI companion for sadhaks, grounded in the teachings of **Dr. Narayan Dutt Shrimali** (Paramhans Swami Nikhileshwaranand), from his books and the writings of his disciples. Practical remedies (switch words, Bach flower remedies, Reiki) are woven in when they suit a seeker's situation. It also offers a full set of free Vedic astrology, panchang and practice tools. English and Hindi throughout.

**Stack:** FastAPI · LlamaIndex · MongoDB Atlas Vector Search · Krutrim (`gpt-oss-120b`) · HuggingFace multilingual embeddings · Next.js 16 · Tailwind · jyotipy (MIT)

**Current branch with all work:** `feat/redesign-v4`. It contains `main` and every feature branch (`feat/global-ui`, `feat/web-corpus`, `feat/astro`, `feat/redesign-v3`).

---

## What's built

### The companion (chat at `/chat`)
- **Answers from the sources.** It answers from the books and from whole articles, not fragments, in the language of the question.
- **Exact mantras.**
  - Every Devanagari mantra in an answer is checked letter by letter against one source.
  - A near-miss is repaired from the source. A mantra with no match is retried, then removed.
  - Procedures (counts, mala, days, direction, offerings) are kept as the source gives them.
- **Asks before prescribing.**
  - For personal requests (wealth, marriage, vashikaran, health, job…), it first asks about the purpose, who the practice is for, and the seeker's experience and diksha.
  - It then personalises the answer, says why the practice suits them, and remembers follow-ups within the session.
- **Remedies when they suit.** Switch words and flower remedies come in under these rules:
  - **When:**
    - When the message describes a life situation (worry, sleep, exams, job, money, marriage, family, health…), the closest remedy post is added as gentle support after the main sadhana.
    - Questions about a teaching don't get one.
  - **Exactness:**
    - Switch words are verified against their source, like mantras.
    - Methods are quoted from the post's own instruction, with no invented doses.
  - **Presentation:** these sources are shown without attribution and never listed as sources under an answer.
- **Guardrails.**
  - No binding vashikaran against an unwilling person.
  - One-line guru warnings for tantra and parad.
  - Never steps for processing mercury.
  - Health questions always keep medical care first.
- **Spelling-proof retrieval.**
  - Consonant skeletons (ITRANS), so "soundarya", "saundarya" and "सौन्दर्य" all match.
  - A book boost when the question names a book's topic.
  - Title matching, plus follow-up context carried across turns.

### Free tools (`/tools`, and the **Free tools** menu)
| Group | Tools |
|---|---|
| Your chart | Kundli (North Indian chart, planets, houses, Vimshottari dasha, Sade Sati) with tabs for all **16 divisional charts** (D1–D60), **nakshatra reading**, **Ishta Devata** (Jaimini karakamsha), **Mangal dosha** (lagna/Moon/Venus + cancellations), **Ashtakavarga** (BAV + SAV), **career & marriage factors**, **Western** tropical wheel with aspects · **Kundli matching** (Ashtakoot, 36 gunas, Nadi/Bhakoot dosha, Mangal balance) · **Varshaphal** (solar return, year lagna, muntha) |
| Every day | **Your day** (tara bala, chandra bala, chandrashtama, week ahead, navtara chakra) · **Panchang** · **Muhurat** (sunrise/sunset, 24 horas, choghadiya, Rahu Kaal, Yamaganda, Gulika, Abhijit, Brahma muhurta) · **Vrat calendar** (Ekadashi, Pradosh, Purnima, Amavasya, Shivaratri, Chaturthi, Sankranti, moon phases, `.ics` export) · **Nakshatra explorer** |
| Readings | **Numerology & Lo Shu grid** (moolank, bhagyank, Chaldean name number, personal year, planes, missing numbers with remedies, Kua number) · **Tarot** (public-domain 1909 Rider–Waite–Smith deck; card of the day, three-card spread) · **Guided palm reading** · **Switch words finder** |
| Practice | **Mala counter** (108 beads, bell, target, streak) · **Puja-room Vastu** (zone plan, facing for japa, phone compass) |

### Accuracy notes
- **Planet positions:** from jyotipy, checked against NASA JPL DE421: within 0.011° for the Moon and 0.002° for the planets. The ascendant uses our own formula, because jyotipy 0.2.0 returns the descendant.
- **Sunrise and sunset:** use the NOAA solar equations and agree with DE421 to within 4 seconds.
- **Vrat dates:**
  - Ekadashi and Amavasya follow the tithi at sunrise; Pradosh and Purnima at dusk; Shivaratri at midnight; Chaturthi at midday.
  - Local traditions can differ by a day, and the page says so.
- **Tests:** 64 astrology tests and 10 RAG-service tests (see below).

### Site
- **Design:** a night-and-gold design (Cormorant Garamond + DM Sans), with light and dark themes and full Hindi.
- **Home page:**
  - a question box;
  - a real recorded conversation;
  - sadhanas by deity;
  - today's tithi and practice for the visitor's city;
  - a birth form beside the chart of the moment;
  - the free tools, the teacher, FAQ and the WhatsApp waitlist.
- **Privacy:** birth details, japa counts and similar data stay in the visitor's browser and are sent only to be calculated. There are no accounts yet.

---

## Architecture

```
platform/
├── apps/
│   ├── api/                        # FastAPI
│   │   ├── main.py                 # app, CORS, routers
│   │   └── routers/
│   │       ├── query.py            # chat (sessions, ask-first, sources)
│   │       ├── astro.py            # /astro/chart, panchang, muhurat, match, day, varshaphal, calendar, places
│   │       ├── switchwords.py      # /switchwords finder
│   │       ├── books.py            # /books, /topics
│   │       ├── wisdom.py           # /search, daily wisdom
│   │       └── articles.py, admin.py, analytics.py, subscribe.py
│   └── web/                        # Next.js 16 App Router
│       ├── app/                    # one folder per page (kundli, matching, muhurat, tarot, japa …)
│       ├── components/             # home/, kundli/, day/, practice/, matching/, tarot/, numerology/ …
│       └── lib/                    # api.ts, i18n/ (en.ts source of truth, hi.ts), tools.ts, content (tarot, nakshatras …)
├── services/
│   ├── astro/                      # chart.py, jyotish.py (vargas, karakas, ashtakavarga …), matching.py,
│   │                               # muhurat.py, daily.py (navtara, varshaphal, vrat calendar), places.py, tests/
│   └── rag-service/
│       ├── rag/                    # answer.py (prompt, retrieval, verification), switchwords.py, hide_names.py
│       ├── ingestion/              # ingest.py (books), web_crawler.py, web_sources.py, ingest_web.py
│       └── tests/
└── packages/shared/schemas.py      # Pydantic models
data/                               # crawled pages, ephemeris, GeoNames (gitignored)
```

---

## Running locally

**Prerequisites:**
- Python 3.11
- Node 20+
- MongoDB Atlas with vector search
- a Krutrim API key

```bash
git clone https://github.com/RahulSure/rag_chatbot.git
cd rag_chatbot
git switch feat/redesign-v4
cp .env.example .env              # fill KRUTRIM_API_KEY, MONGODB_URI, MONGODB_DB_NAME, MONGODB_COLLECTION, HF_TOKEN, ADMIN_SECRET
python -m venv env && env\Scripts\activate
pip install -r platform/apps/api/requirements.txt
cd platform/apps/web && npm install
```

**Start the API and the web app (two terminals):**
```bash
# API on :8000 (from the repo root)
env\Scripts\python -m uvicorn apps.api.main:app --app-dir platform --host 127.0.0.1 --port 8000

# Web on :3000
cd platform/apps/web && npm run dev
```

**Open:**
- http://localhost:3000 for the site
- http://localhost:8000/api/docs for the API docs

**Place data:** the place search uses GeoNames `cities15000` (CC BY 4.0) in `data/geo/`, downloaded on first use.

### Content ingestion
```bash
cd platform/services/rag-service
python -m ingestion.web_crawler --sites <slug> [--max-pages N]   # polite crawl (robots.txt, crawl-delay) into data/web/
python -m ingestion.ingest_web --sites <slug>                    # embed and store (replaces that site's chunks)
python -m ingestion.ingest_web --sites <slug> --incremental      # embed only pages not stored yet
```
Sites are registered in `ingestion/web_sources.py`.

### Tests
```bash
cd platform && python -m pytest services/astro/tests -q            # chart, vargas, matching, muhurat, calendar
cd platform/services/rag-service && python -m pytest tests -q      # switch-word checks, name hiding
```
The JPL comparisons run when `data/ephemeris/de421.bsp` is present.

---

## Next planned steps

### Now
1. **Finish loading the remedy sites.** The crawl is about two-thirds done. When it finishes, run `ingest_web --incremental` for `reachonnaran` and `reachlotus`, then restart the API.
2. **Tighten remedy methods in Hindi answers.** Switch words are always exact, but the method is sometimes paraphrased. Pre-extract each post's instruction sentence and pass it to the prompt as a fixed line.
3. **Fix daily wisdom.** It reads a hard-coded `embeddings` collection; use `MONGODB_COLLECTION`, as `/books` now does.
4. **Merge `feat/redesign-v4` into `main`** after a review pass.

### Phase 4: remember the seeker
- Sign in with Google.
- A seeker profile filled in from conversation: birth details, experience, diksha, current practices and goals.
- Sadhak reads the profile before answering: no repeated questions, and follow-ups on the practice in progress.
- Saved chats and charts.
- A "delete my data" control. Birth data is personal data under India's DPDP rules.

### Go live (free tiers)
- **Frontend:** Vercel.
- **API:** a Hugging Face Space. It needs about 2 GB of RAM for the embedding model.
- **Data:** the existing MongoDB Atlas.
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`, restrict CORS, and add startup checks for required environment variables.

### Daily guidance and subscriptions
- **Delivery:** a morning message matched to the day's tithi and the seeker's own tara. Start with a free Telegram bot or email.
- **WhatsApp later:** its API charges per message for business-initiated messages.
- **Payments:** Razorpay for paid tiers when subscriptions start.

### More content
- **Shrimali-ji's books:** ingest more of them; they are the biggest quality lever.
- **Other traditions:** public-domain texts (Gita, Upanishads, Vivekananda, Kabir, Dhammapada), with per-source licence metadata.

### Tools still open
- Sarvatobhadra chakra (layout to be verified first).
- Named Ekadashis and festivals, which need lunar-month logic.
- Sankashti Chaturthi, which needs moonrise.
- A guru-reviewed edit of the written meanings: nakshatras, tarot, palm, Vastu and the Ishta Devata deities.

---

## Security and privacy
- `.env` is never committed; use `.env.example`.
- `ADMIN_SECRET` gates `/admin/*` and article generation.
- Rate limiting: 10 questions per 30 minutes per IP.
- Crawling respects `robots.txt` and crawl-delay. Bot challenges are never bypassed, and private groups are not scraped.
- Personal details in remedy posts (names, emails, links) are scrubbed on ingestion.

---

*Built for every seeker. ॐ परम तत्वाय नारायणाय गुरुभ्यो नमः*
