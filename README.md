# Sadhak.ai — AI Spiritual Companion

> An AI-powered spiritual knowledge platform grounded in the teachings of **Sadgurudev Dr. Narayan Dutt Shrimali**. Built to serve every seeker — starting with Shrimali's 150+ books, expanding to all spiritual traditions.

**Stack:** FastAPI · LlamaIndex · MongoDB Atlas · Next.js 16 · Krutrim LLM · HuggingFace Embeddings

---

## 🚀 What's Been Built

### Core Platform
| Feature | Status | Notes |
|---|---|---|
| RAG Chat (AI Q&A) | ✅ Live | Krutrim LLM + LlamaIndex + MongoDB Atlas Vector Search |
| Semantic Search | ✅ Live | `/search` endpoint + frontend |
| Teachings by Topic | ✅ Live | 10 topics: tantra, mantra, kundalini, jyotish, etc. |
| Daily Wisdom | ✅ Live | Hindi/English, served from vector store |
| Blog / Articles | ✅ Live | AI-generated, admin-approved, bilingual |
| Books Library | ✅ Live | 2 books ingested (Saundarya, Mantra Rahasya) |
| Admin Dashboard | ✅ Live | Article generation, book ingestion, analytics |
| Analytics | ✅ Live | Trending queries, usage stats |
| About Gurudev | ✅ Live | `/guru` page |

### Sprint 1 Features (Completed)
| Feature | Details |
|---|---|
| **Suggested Follow-ups** | After every AI answer, 3 clickable follow-up question pills appear |
| **WhatsApp "Coming Soon"** | Floating badge + section — no dead link, sets expectation |
| **PWA Manifest** | App installable on Android/iOS via "Add to Home Screen" |
| **Email Capture** | Homepage email form → saves to MongoDB `email_subscribers` |
| **Hindi Language Toggle** | Navbar toggle EN ⇄ हिं — translates nav links, taglines, CTAs |

### Sprint 2 Features (Completed)
| Feature | Details |
|---|---|
| **Bilingual Articles** | Articles generated in Hindi OR English via `language` param |
| **Hindi Article Prompt** | Full Devanagari prompt instructs Krutrim to write in Hindi |
| **Language Filter on Blog** | 🌐 All / 🇬🇧 English / 🇮🇳 हिन्दी tabs on blog page |
| **Language Badge on Cards** | Each article card shows amber हिन्दी or sky EN badge |
| **Rate Limiting** | 10 questions / 30 min per IP → 1-hour cooldown. Amber card in chat UI |
| **Rebrand → Sadhak.ai** | Platform renamed from "Shrimali AI" to "Sadhak.ai" |
| **Guru Avaahan Mantra** | MP3 plays as background audio when user unmutes the carousel |

---

## 🏗️ Architecture

```
rag_chatbot/
├── platform/
│   ├── apps/
│   │   ├── api/                    # FastAPI backend
│   │   │   ├── main.py             # App entry point, routers, CORS
│   │   │   ├── middleware.py       # Logging, Prometheus, Rate Limiting
│   │   │   ├── deps.py             # DB/Redis dependencies
│   │   │   └── routers/
│   │   │       ├── query.py        # RAG Q&A (rate-limited)
│   │   │       ├── articles.py     # Blog CRUD + language filter
│   │   │       ├── books.py        # Book library
│   │   │       ├── wisdom.py       # Daily wisdom
│   │   │       ├── analytics.py    # Trending queries, stats
│   │   │       ├── admin.py        # Upload, ingest, manage
│   │   │       └── subscribe.py    # Email capture
│   │   └── web/                    # Next.js 16 App Router frontend
│   │       ├── app/                # Pages (home, chat, blog, teachings, guru, search)
│   │       ├── components/         # UI components
│   │       └── lib/                # API client, useStream hook
│   ├── services/
│   │   ├── rag-service/            # LlamaIndex RAG engine, embeddings, vector store
│   │   └── article_engine/         # AI article generator (sync, bypasses Celery locally)
│   └── packages/
│       ├── shared/schemas.py       # Pydantic models shared across services
│       └── prompts/article_prompt.py  # EN + HI article generation prompts
├── env/                            # Python venv (not committed)
├── .env                            # Secrets (never committed)
├── .env.example                    # Template for env setup
├── start_backend.bat               # One-click backend launcher
└── start_frontend.bat              # One-click frontend launcher
```

---

## ⚡ Running Locally

### Prerequisites
- Python 3.11 with venv at `env/`
- Node.js 20+ (`C:\Program Files\nodejs\`)
- MongoDB Atlas with vector search enabled
- Krutrim API key

### Setup
```bash
# 1. Clone
git clone https://github.com/RahulSure/rag_chatbot.git
cd rag_chatbot

# 2. Copy env and fill values
cp .env.example .env

# 3. Create Python venv and install deps
python -m venv env
env\Scripts\activate
pip install -r platform/apps/api/requirements.txt

# 4. Install frontend deps
cd platform/apps/web && npm install
```

### Start Servers

**Windows — just double-click:**
- `start_backend.bat` → FastAPI on :8000
- `start_frontend.bat` → Next.js on :3000

**Manual:**
```bash
# Backend
cd platform
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (separate terminal)
cd platform/apps/web
npm run dev
```

### URLs
| URL | Description |
|---|---|
| http://localhost:3000 | Sadhak.ai frontend |
| http://localhost:8000/health | API health check |
| http://localhost:8000/api/docs | Swagger UI |
| http://localhost:3000/admin | Admin dashboard |

### Required `.env` values
```env
KRUTRIM_API_KEY=your_key
KRUTRIM_MODEL=gpt-oss-120b
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=dr-narayan-dutt
MONGODB_COLLECTION=books
HF_TOKEN=your_hf_token
ADMIN_SECRET=your_admin_password
```

---

## 📋 Next Plan — Production Roadmap

### 🔴 This Week — Go Live

| Task | Why |
|---|---|
| Deploy backend to Railway / Render | App is localhost-only right now |
| Deploy frontend to Vercel | Set `NEXT_PUBLIC_API_URL` to production API URL |
| Buy domain `sadhak.ai` or `sadhak.in` | Brand identity |
| SSL (auto via Vercel / Railway) | Required for production |
| `app/sitemap.ts` — dynamic sitemap | Google can't index articles without it |
| `app/robots.txt` | Allow all crawlers |
| `app/not-found.tsx` + `app/error.tsx` | Custom 404/500 pages |
| Startup env validation | Crash early if secrets missing |

### 🟡 Month 1 — Foundation for Growth

| Task | Why |
|---|---|
| Ingest 5–10 more books | Biggest quality lever — smarter answers immediately |
| Google OAuth (`next-auth`) | Foundation for bookmarks, history, paid tiers |
| User sessions in MongoDB | Persist chat history across devices |
| Sentry error monitoring | Know when production breaks |
| GA4 analytics | Understand traffic, popular articles, drop-offs |
| Cover images for articles | Cards look bare; use Unsplash API by topic |
| Loading skeletons | Blog and chat feel blank while loading |
| Redis (production) | Distributed rate limiting + session storage |

### 🟢 Month 2 — Monetization

| Task | Details |
|---|---|
| Razorpay subscriptions | Free: 10 q/day · Sadhak ₹199/mo: unlimited · Guru ₹499/mo: all features |
| Pricing page `/pricing` | Tier comparison with CTA |
| Upgrade modal | Shown when free limit hit → Razorpay checkout |
| Per-user rate limiting | After auth: limit by user ID not just IP |
| Webhook handler | `/webhook/razorpay` → update user tier on payment |

### 🔵 Month 3+ — Scale & Community

| Task | Details |
|---|---|
| WhatsApp bot | Meta Cloud API — message bot → get AI answer |
| Sadhana tracker | Log daily practice, AI suggests next steps |
| Bookmarks & collections | Save passages, AI answers, articles |
| Audio answers (TTS) | Hindi voice for AI answers — commuter-friendly |
| Mobile app | React Native shell over existing API |
| All 150+ Shrimali books | The data moat — every book = better answers |
| Multi-guru expansion | Add Osho, Ramana Maharshi, Yogananda, etc. |

---

## 💡 The Vision

**Starting point:** Dr. Narayan Dutt Shrimali's 150+ books — the most documented spiritual science library in India.

**End goal:** The definitive AI companion for every spiritual seeker (साधक) — not tied to one guru, one tradition, or one language.

**The moat:** Data + compounding. Every book ingested makes answers smarter. Every question answered feeds trending analytics. Every article published grows SEO. The flywheel starts now.

---

## 🔐 Security

- `.env` is **never committed** — use `.env.example` as template
- `ADMIN_SECRET` gates all `/admin/*` and `/articles/generate` endpoints
- Rate limiting: 10 questions / 30 min per IP, 1-hour ban on breach
- CORS configured via `CORS_ORIGINS` env var (default `*`, restrict in production)

---

*Built with ❤️ for every seeker. ॐ परम तत्वाय नारायणाय गुरुभ्यो नमः*
