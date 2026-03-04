<p align="center">
  <img src="docs/images/bware-logo.png" alt="B-ware Logo" width="200"/>
</p>

<h1 align="center">B-ware : No Lies Told</h1>

<p align="center">
  <strong>An AI-powered fact-checking platform that verifies economic claims using real-time data, NLI models, and LLM reasoning.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-blue?logo=python" alt="Python"/>
  <img src="https://img.shields.io/badge/node.js-18+-green?logo=nodedotjs" alt="Node.js"/>
  <img src="https://img.shields.io/badge/fastapi-0.115-009688?logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/express-5.x-000000?logo=express" alt="Express"/>
  <img src="https://img.shields.io/badge/mysql-8.0-4479A1?logo=mysql" alt="MySQL"/>
  <img src="https://img.shields.io/badge/redis-7.x-DC382D?logo=redis" alt="Redis"/>
  <img src="https://img.shields.io/badge/react-18-61DAFB?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License"/>
</p>

---

## What is B-ware?

B-ware is a full-stack fact-checking platform that takes economic claims — like _"India's GDP growth rate was 7.5% in 2024"_ — and verifies them against official data sources, news evidence, and AI reasoning.

It doesn't just tell you **true or false**. It shows you:

- The **official value** from World Bank data
- The **percentage error** between the claim and reality
- **News evidence** from multiple sources (Google Fact Check, NewsAPI)
- An **AI-generated explanation** of why the claim is accurate, misleading, or false
- A **danger score** for trending rumours in the news

![Hero Screenshot](docs/images/hero-screenshot.png)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [The RAV Engine](#the-rav-engine)
- [Tiered Verification Architecture — Deep Dive](#tiered-verification-architecture--deep-dive)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [Supported Metrics](#supported-metrics)
- [Data Sources](#data-sources)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Verification

- **Single Claim Verification** — paste any economic claim and get an instant verdict
- **Paragraph Analysis** — submit a full paragraph; B-ware splits it into sentences, scores each for claim probability, and extracts verifiable claims automatically
- **Batch Processing** — verify up to 50 claims in a single API call
- **Three Verification Depths** — Quick (Tier 1), Full (adaptive), Deep (all 3 tiers)

### RAV Engine (Retrieval-Augmented Verification)

- **Tier 1 — Numeric Check** — compares claimed values against World Bank official data in real time; supports **11 countries** (IN, US, CN, GB, JP, DE, FR, BR, CA, AU, KR)
- **Tier 2 — NLI Evidence Check** — fetches news snippets and runs an NLI model (BART-MNLI) to detect entailment or contradiction
- **Tier 3 — LLM Reasoning** — sends everything to Gemini 1.5 Flash for nuanced, multi-source reasoning

### Extraction Engine Highlights

- **Fiscal year support** — `FY2024-25` →2025, `2023-24` →2024
- **Word-form numbers** — `1.4 billion` →1,400,000,000; `₹2 lakh crore` →2×10¹²
- **Multi-country detection** — 14 country patterns → ISO 3166-alpha-3 codes, automatically routed to the correct World Bank country endpoint
- **Value-type disambiguation** — extraction output includes `value_type: “percentage” | “absolute”` for downstream comparison logic
- **Weighted confidence** — metric 50% + value 30% + year 20% formula; all regexes pre-compiled at module load

### Trending Rumours Feed

- Monitors news outlets and fact-check databases every 30 minutes
- Ranks stories by a **danger score** (0–100) based on verdict severity, confidence, recency, and spread
- Public-facing page showing the most dangerous misinformation right now

### Dashboard & Analytics

- Personal verification history with search and filters
- Verdict distribution charts (pie, bar, timeline, scatter)
- Source credibility leaderboard — which outlets spread the most misinformation

### Security & Performance

- JWT authentication with Redis-backed logout (token blacklisting)
- Redis caching for claim deduplication (24h TTL) and trending feed (5min TTL)
- Rate limiting (100 req/15min per IP with Redis store on backend; 10 req/min per IP on `/verify/deep` via slowapi)
- **L1 result cache** — in-process TTL cache (1hr) in the NLP service prevents duplicate World Bank + NewsAPI + Gemini calls
- **30-second timeout guard** on all `/verify` endpoints — returns `verdict="unverifiable"` gracefully on slow APIs

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│              React App — localhost:3000                   │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTP + JWT
                        ▼
┌──────────────────────────────────────────────────────────┐
│             NODE.JS BACKEND — localhost:5000              │
│                                                          │
│  Express.js │ JWT Auth │ Rate Limit │ Redis Cache        │
│                                                          │
│  /api/auth/*       — register, login, logout             │
│  /api/claims/*     — verify, quick, deep, history        │
│  /api/trending/*   — rumour feed, sources, refresh       │
└──────┬──────────────────┬─────────────────┬──────────────┘
       │                  │                 │
       ▼                  ▼                 ▼
┌────────────┐    ┌────────────┐    ┌──────────────────┐
│ MySQL 8.0  │    │ Redis 7.x  │    │ NLP Service      │
│ :3306      │    │ :6379      │    │ (Python) :5001   │
│            │    │            │    │                  │
│ users      │    │ claim cache│    │ 11 endpoints     │
│ claims     │    │ trending   │    │ RAV 3-tier engine│
│ verdicts   │    │ rate limit │    │ BART-MNLI model  │
│ trending   │    │ JWT block  │    │ Gemini 1.5 Flash │
└────────────┘    └────────────┘    └──────────────────┘
```

![Architecture Diagram](docs/images/architecture-diagram.png)

---

## The RAV Engine

**RAV = Retrieval-Augmented Verification**

Instead of training a model to memorize facts, RAV **retrieves evidence at query time** and uses pre-trained reasoning models to compare claims against that evidence.

```
Claim: "India's GDP growth rate was 7.5% in 2024"

┌─────────────────────────────────────────────────────────────────┐
│ TIER 1 — Numeric Check (< 500ms)                               │
│ World Bank API → official value: 6.49%                          │
│ % error: 15.48% → MISLEADING (between 5-20%)                   │
│                                                                 │
│ Error is in the ambiguous 5-20% zone → escalate to Tier 2       │
├─────────────────────────────────────────────────────────────────┤
│ TIER 2 — NLI Evidence Check (500ms - 2s)                        │
│ Fetch 3-5 news snippets from NewsAPI + Google Fact Check        │
│ Run BART-MNLI: claim vs each snippet → entail/contradict/neutral│
│ Aggregated NLI verdict: contradiction (confidence: 0.72)        │
│                                                                 │
│ Confidence ≥ 0.6 → return merged Tier 1 + Tier 2 result         │
├─────────────────────────────────────────────────────────────────┤
│ TIER 3 — LLM Reasoning (1-3s) [only if Tier 2 is uncertain]    │
│ Gemini 1.5 Flash receives: claim + numeric data + evidence      │
│ Returns JSON: { verdict, confidence, explanation, sources_used } │
└─────────────────────────────────────────────────────────────────┘
```

### Verdict Rules

| % Error  | Verdict          | Color     |
| -------- | ---------------- | --------- |
| < 5%     | **Accurate**     | 🟢 Green  |
| 5% – 20% | **Misleading**   | 🟠 Orange |
| ≥ 20%    | **False**        | 🔴 Red    |
| No data  | **Unverifiable** | ⚪ Gray   |

![Verdict Card](docs/images/verdict-card.png)

---

---

## Tiered Verification Architecture — Deep Dive

This section explains the internal routing logic, data flow, and confidence scoring
that powers the RAV engine. Understanding this is essential for anyone working on
the backend integration or frontend evidence display.

### Routing Flow

```
User submits claim
        │
        ▼
┌─────────────────────────────────┐
│ Layer 0: EXTRACTION             │
│ extractor.py → metric/value/year│
│ + extraction confidence (0-1)   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ TIER 1: Numeric Check           │
│ World Bank API → official value │
│ Calculate % error               │
│                                 │
│ Decisive? (error <5% or ≥20%   │
│   AND extraction conf ≥ 0.8)   │
│   YES → return tier1 result ────┼──→ DONE
│   NO  ↓                        │
└────────────┬────────────────────┘
             │ ambiguous or low confidence
             ▼
┌─────────────────────────────────┐
│ TIER 2: Evidence + NLI          │
│ Fetch snippets (Fact Check +    │
│   NewsAPI) → run BART-MNLI on   │
│   each snippet → majority vote  │
│                                 │
│ Confident? (NLI conf ≥ 0.6)    │
│   YES → merge T1+T2, return ───┼──→ DONE
│   NO  ↓                        │
└────────────┬────────────────────┘
             │ low NLI confidence
             ▼
┌─────────────────────────────────┐
│ TIER 3: LLM Reasoning          │
│ Build prompt with: claim +     │
│   numeric data + evidence       │
│ Send to Gemini 1.5 Flash       │
│ Parse JSON response             │
│ Return tier3 result ────────────┼──→ DONE
└─────────────────────────────────┘
```

> **`/verify/deep` (force_tier3=True):** Bypasses all early returns and always runs
> through all three tiers, returning the Tier 3 result regardless of earlier confidence.

### Confidence Scoring

Each tier produces a confidence score differently:

| Tier               | Confidence Formula                                   | Range     |
| ------------------ | ---------------------------------------------------- | --------- |
| **Tier 1**         | `extraction_confidence × (1 - percentage_error/100)` | 0.0 – 1.0 |
| **Tier 2**         | Average NLI score of the majority-vote label         | 0.0 – 1.0 |
| **Tier 3**         | Self-reported by the LLM (clamped to 0.0–1.0)        | 0.0 – 1.0 |
| **Merged (T1+T2)** | `(tier1_confidence + tier2_confidence) / 2`          | 0.0 – 1.0 |

### Escalation Thresholds

These constants live in `verdict_router.py` and control when the router escalates:

| Constant                 | Value | Meaning                                                   |
| ------------------------ | ----- | --------------------------------------------------------- |
| `TIER1_STRONG_THRESHOLD` | 0.8   | Extraction confidence must be ≥ this for Tier 1 fast-path |
| `TIER1_ERROR_CLEAR_LOW`  | 5.0%  | Error below this → definitely accurate                    |
| `TIER1_ERROR_CLEAR_HIGH` | 20.0% | Error above this → definitely false                       |
| `TIER2_CONFIDENCE_MIN`   | 0.6   | NLI confidence below this → escalate to Tier 3            |

### Database Persistence

The verification pipeline produces intermediate data at each tier. These are stored in
dedicated database tables so the frontend can display evidence cards and explanations:

| Python Dataclass     | Database Table                                               | Relationship           |
| -------------------- | ------------------------------------------------------------ | ---------------------- |
| `VerificationResult` | `verification_log` (with tier_used, confidence, explanation) | 1 per claim            |
| `EvidenceSnippet`    | `evidence_snippets`                                          | Many per claim         |
| `NliResult`          | `nli_results`                                                | 1 per evidence snippet |
| `Tier3Result`        | `tier3_results`                                              | 0 or 1 per claim       |

```
claims (1) ──→ verification_log (1)
           ──→ evidence_snippets (many) ──→ nli_results (1 each)
           ──→ tier3_results (0 or 1)
```

### NLI Model Details

| Property         | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| **Model**        | `facebook/bart-large-mnli`                             |
| **Task**         | Zero-shot classification                               |
| **Size**         | ~1.6 GB (downloaded once, cached locally)              |
| **Device**       | CPU (no GPU required)                                  |
| **Labels**       | entailment, contradiction, neutral                     |
| **Upgrade path** | `cross-encoder/nli-deberta-v3-large` (higher accuracy) |

### Testing the RAV Engine

```bash
cd nlp-service

# Run all 76 tests (extraction + claim detector + all 3 verification tiers)
python -m pytest tests/ -v

# Run only tier-specific tests
python -m pytest tests/test_tier2_nli.py -v
python -m pytest tests/test_tier3_llm.py -v
python -m pytest tests/test_verdict_router.py -v
```

All Tier 2/3 tests use **mocked API calls** — no API keys, internet, or GPU required.
The BART model is mocked in tests so they run in under 3 seconds.

## Tech Stack

| Layer           | Technology                                       | Purpose                                                   |
| --------------- | ------------------------------------------------ | --------------------------------------------------------- |
| **Frontend**    | React 18, React Router v6, TailwindCSS, Recharts | SPA with responsive UI and data visualizations            |
| **Backend**     | Node.js 18+, Express 5, JWT, bcryptjs            | REST API gateway, auth, business logic                    |
| **NLP Service** | Python 3.10+, FastAPI, Pydantic v2               | AI/ML microservice for extraction & verification          |
| **NLI Model**   | HuggingFace `facebook/bart-large-mnli`           | Natural Language Inference (entail/contradict)            |
| **LLM**         | Google Gemini 1.5 Flash                          | Multi-source reasoning and explanation generation         |
| **Database**    | MySQL 8.0                                        | Persistent storage for users, claims, verdicts            |
| **Cache**       | Redis 7.x (ioredis)                              | Claim dedup, rate limiting, trending cache, JWT blacklist |
| **Data APIs**   | World Bank, NewsAPI, Google Fact Check           | Official data + live news evidence                        |

---

## Project Structure

```
full_stack/
├── README.md                          ← you are here
├── todo.txt                           ← backend + frontend build guide
├── NLP_todo.txt                       ← remaining NLP improvements
│
├── backend/                           ← Node.js Express API
│   ├── package.json
│   ├── server.js                      ← Express entry point (:5000)
│   ├── .env                           ← DB, Redis, JWT secrets
│   ├── config/
│   │   ├── db.js                      ← MySQL connection pool
│   │   └── redis.js                   ← ioredis client
│   ├── middleware/
│   │   └── auth.js                    ← JWT verification + Redis blacklist
│   ├── controllers/
│   │   ├── authController.js          ← register, login, logout
│   │   ├── claimController.js         ← verify, history, stats
│   │   └── trendingController.js      ← trending feed, danger scores
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── claimRoutes.js
│   │   └── trendingRoutes.js
│   ├── jobs/
│   │   └── trendingJob.js             ← cron: refresh trending every 30min
│   └── seeders/
│       └── worldBankSeeder.js         ← populate official_data_cache
│
├── nlp-service/                       ← Python FastAPI AI service ✅ COMPLETE
│   ├── main.py                        ← 11 FastAPI endpoints (:5001)
│   ├── extractor.py                   ← regex extraction (metric/value/year)
│   ├── metrics.py                     ← 10 supported economic metrics
│   ├── claim_detector.py              ← sentence splitting + scoring
│   ├── swagger_ui.py                  ← custom dark Swagger theme
│   ├── requirements.txt
│   ├── .env                           ← API keys (NewsAPI, Gemini, etc.)
│   ├── verifier/                      ← RAV Engine package
│   │   ├── __init__.py
│   │   ├── tier1_numeric.py           ← World Bank numeric check
│   │   ├── evidence_fetcher.py        ← Google Fact Check + NewsAPI
│   │   ├── tier2_nli.py               ← BART-MNLI NLI pipeline
│   │   ├── tier3_llm.py               ← Gemini 1.5 Flash reasoning
│   │   └── verdict_router.py          ← 3-tier orchestrator
│   └── tests/
│       ├── conftest.py            ← autouse fixture: clears L1 result cache between tests
│       ├── test_extractor.py      ← 33 test cases (extraction + claim detector)
│       ├── test_tier2_nli.py      ← Tier 2 NLI tests (mocked)
│       ├── test_tier3_llm.py      ← Tier 3 LLM tests (mocked)
│       └── test_verdict_router.py ← Router logic tests (mocked)
│
├── frontend/                          ← React app (to be built)
│
└── database/
    └── schema.sql                     ← MySQL table definitions
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ with pip
- **MySQL** 8.0+
- **Redis** 7.x (Docker recommended: `docker run -d -p 6379:6379 redis`)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/bware.git
cd bware
```

### 2. Set up the database

```bash
mysql -u root -p < database/schema.sql
```

### 3. Start the NLP service

```bash
cd nlp-service
python -m venv venv        # or use existing venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
python main.py
# → http://localhost:5001/docs
```

![Swagger UI](docs/images/swagger-ui.png)

### 4. Start the backend

```bash
cd backend
npm install
npm install ioredis express-rate-limit rate-limit-redis axios node-cron
cp .env.example .env       # edit with your MySQL/Redis credentials
npm run dev
# → http://localhost:5000/api/health
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

### 6. Seed official data (optional)

```bash
cd backend
node seeders/worldBankSeeder.js
```

---

## API Reference

### NLP Service (port 5001) — Internal

| Method | Endpoint        | Description                                         |
| ------ | --------------- | --------------------------------------------------- |
| `GET`  | `/health`       | Health check                                        |
| `GET`  | `/metrics`      | List 10 supported metrics                           |
| `POST` | `/extract`      | Extract metric/value/year from a single claim       |
| `POST` | `/batch`        | Batch extraction (up to 50 claims)                  |
| `POST` | `/analyze`      | Paragraph → split + score + extract                 |
| `POST` | `/verify/quick` | Tier 1 numeric verification only                    |
| `POST` | `/verify`       | Full 3-tier RAV pipeline                            |
| `POST` | `/verify/deep`  | Force all 3 tiers (rate-limited: 10 req/min per IP) |

### Backend API (port 5000) — Public

| Method | Endpoint                | Auth  | Description                   |
| ------ | ----------------------- | ----- | ----------------------------- |
| `POST` | `/api/auth/register`    | No    | Create account                |
| `POST` | `/api/auth/login`       | No    | Get JWT token                 |
| `POST` | `/api/auth/logout`      | Yes   | Blacklist token               |
| `POST` | `/api/claims/verify`    | Yes   | Full verification             |
| `POST` | `/api/claims/quick`     | Yes   | Quick (Tier 1) verification   |
| `POST` | `/api/claims/deep`      | Yes   | Deep (all tiers) verification |
| `GET`  | `/api/claims`           | Yes   | User's claim history          |
| `GET`  | `/api/claims/stats`     | Yes   | Verdict distribution stats    |
| `GET`  | `/api/claims/:id`       | Yes   | Full claim detail             |
| `GET`  | `/api/trending`         | No    | Trending rumours feed         |
| `GET`  | `/api/trending/sources` | No    | Source credibility board      |
| `GET`  | `/api/trending/:id`     | No    | Trending story detail         |
| `POST` | `/api/trending/refresh` | Admin | Force trending refresh        |

### Example Request

```bash
curl -X POST http://localhost:5000/api/claims/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "India'\''s GDP growth rate was 7.5% in 2024"}'
```

### Example Response

```json
{
  "original_text": "India's GDP growth rate was 7.5% in 2024",
  "tier_used": "tier2",
  "verdict": "misleading",
  "confidence": 0.71,
  "extracted_metric": "GDP growth rate",
  "extracted_value": 7.5,
  "extracted_year": 2024,
  "extracted_country": "IND",
  "value_type": "percentage",
  "official_value": 6.49,
  "percentage_error": 15.48,
  "official_source": "World Bank",
  "evidence": [
    {
      "source": "Reuters",
      "snippet": "India's GDP grew 6.5% in fiscal 2024...",
      "nli_verdict": "contradiction",
      "nli_score": 0.84
    }
  ],
  "explanation": "Claimed 7.5%, official World Bank value is 6.49% (error: 15.48%). Classified as misleading.",
  "tiers_run": ["tier1", "tier2"]
}
```

---

## Screenshots

| Feature                | Screenshot                                   |
| ---------------------- | -------------------------------------------- |
| **Swagger API Docs**   | ![Swagger](docs/images/swagger-ui.png)       |
| **Claim Verification** | ![Verify](docs/images/verify-page.png)       |
| **Verdict Card**       | ![Verdict](docs/images/verdict-card.png)     |
| **Paragraph Analysis** | ![Analyze](docs/images/analyze-page.png)     |
| **Dashboard**          | ![Dashboard](docs/images/dashboard-page.png) |
| **Charts & Analytics** | ![Charts](docs/images/charts-page.png)       |
| **Trending Rumours**   | ![Trending](docs/images/trending-page.png)   |
| **Source Leaderboard** | ![Sources](docs/images/sources-page.png)     |
| **Login Page**         | ![Login](docs/images/login-page.png)         |
| **Mobile View**        | ![Mobile](docs/images/mobile-view.png)       |

---

## Supported Metrics

B-ware recognises **10 economic indicators** mapped to World Bank API codes.
Multi-country support covers **11 countries** (India, USA, China, UK, Japan, Germany, France, Brazil, Canada, Australia, South Korea) — the country is detected automatically from the claim text.

| Metric                    | World Bank Code     | Value Type | Example Claim                            |
| ------------------------- | ------------------- | ---------- | ---------------------------------------- |
| GDP growth rate           | `NY.GDP.MKTP.KD.ZG` | percentage | "GDP grew at 7.5% in 2024"               |
| Inflation rate            | `FP.CPI.TOTL.ZG`    | percentage | "CPI inflation fell to 4.8%"             |
| Unemployment rate         | `SL.UEM.TOTL.ZS`    | percentage | "Unemployment hit 8.1% in 2023"          |
| Fiscal deficit            | `GC.BAL.CASH.GD.ZS` | percentage | "Fiscal deficit was 5.9% of GDP"         |
| Literacy rate             | `SE.ADT.LITR.ZS`    | percentage | "India's literacy rate is 77.7%"         |
| Population                | `SP.POP.TOTL`       | absolute   | "India's population crossed 1.4 billion" |
| Per capita income         | `NY.GDP.PCAP.CD`    | absolute   | "Per capita income reached $2,500"       |
| Poverty rate              | `SI.POV.NAHC`       | percentage | "Poverty rate dropped to 11.4%"          |
| Foreign exchange reserves | `FI.RES.TOTL.CD`    | absolute   | "Forex reserves crossed $650 billion"    |
| Current account deficit   | `BN.CAB.XOKA.GD.ZS` | percentage | "CAD widened to 2.4% of GDP"             |

---

## Data Sources

| Source                                                                        | Type                                | Tier   | Cost              |
| ----------------------------------------------------------------------------- | ----------------------------------- | ------ | ----------------- |
| [World Bank Open Data](https://data.worldbank.org)                            | Official statistics (196 countries) | Tier 1 | Free              |
| [NewsAPI](https://newsapi.org)                                                | News articles (80k+ sources)        | Tier 2 | Free (100/day)    |
| [Google Fact Check Tools](https://developers.google.com/fact-check/tools/api) | Fact-checks (Snopes, AFP, AltNews)  | Tier 2 | Free              |
| [Gemini 1.5 Flash](https://aistudio.google.com)                               | LLM reasoning                       | Tier 3 | Free (15 req/min) |
| [IMF Data API](https://www.imf.org/external/datamapper/api/v1/)               | GDP, fiscal, trade data             | Backup | Free              |
| [RBI DBIE](https://data.rbi.org.in/)                                          | India-specific financial data       | Backup | Free              |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

See [todo.txt](todo.txt) for the complete build guide with step-by-step instructions.

---

## License

This project is licensed under the MIT License.

---

<p align="center">
  <strong>B-ware: Because facts should be verified, not assumed.</strong>
</p>
