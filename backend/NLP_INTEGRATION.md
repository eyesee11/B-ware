# B-ware NLP Service — Backend Integration Guide

> **Last reviewed:** March 6, 2026 — reflects NLP service v1.0.0 (all 4 priority groups complete, 86/86 tests passing).

This guide is for the **Node.js backend team**. It covers every endpoint exposed
by the NLP microservice, the exact request/response shapes, ready-to-paste
`axios` snippets, and error-handling patterns.

> **Live docs (production):** https://eyesee11-b-ware.hf.space/docs  
> **Live docs (local dev):** http://localhost:5001/docs  
> Swagger UI shows all schemas, lets you fire real requests, and has copy-paste
> `curl` examples for every endpoint.

---

## 0. Integration Architecture

```
┌──────────────────────────────────┐
│   React App — localhost:3000      │
│   (Axios + JWT in headers)        │
└─────────────────┬────────────────┘
                  │ HTTP  Authorization: Bearer <JWT>
                  ▼
┌──────────────────────────────────┐
│  Node.js Backend — localhost:5000 │
│                                  │
│  1. cors()       (allow :3000)   │
│  2. express.json()               │
│  3. rateLimiter  (100/15min)     │
│  4. auth.js      (verify JWT)    │
│                                  │
│  Routes:                         │
│  /api/auth/*   — register/login  │
│  /api/claims/* — verify/history  │
│  /api/trending/* — rumour feed   │
└──────┬──────────────┬────────────┘
       │              │
       ▼              ▼
┌────────────┐  ┌──────────────────────────────┐
│ MySQL:3306 │  │  NLP Service                 │
│ Redis:6379 │  │  Local:  http://localhost:5001│
└────────────┘  │  Prod:   https://eyesee11-   │
                │          b-ware.hf.space      │
                └──────────────────────────────┘
```

**Data flow for a single claim verification:**

1. User types claim in React → clicks "Verify"
2. React `POST /api/claims/verify` → Node backend (with JWT)
3. Backend hashes claim (MD5) → checks `Redis claim_result:<hash>` (24 h TTL)
4. Cache hit → return instantly, skip NLP call
5. Cache miss → `INSERT claims (status='pending')`
6. Backend `POST /verify` → NLP service
7. NLP runs Tier 1 → 2 → 3 → returns `FullVerificationResult`
8. `INSERT verification_log` + `UPDATE claims (status='verified')`
9. `SET Redis claim_result:<hash>` (TTL 24 h)
10. Return result to React

> ⚠️ **The frontend must NEVER call the NLP service directly.**  
> All requests go through the Node backend (`localhost:5000`), which adds auth,
> Redis dedup caching, rate limiting, and database persistence.

---

## 1. Service Setup

### Production (HuggingFace — already deployed)

The NLP service is **live on HuggingFace Spaces**. You do not need to run it
yourself unless you are working offline.

|                  | URL                                       |
| ---------------- | ----------------------------------------- |
| **API base**     | `https://eyesee11-b-ware.hf.space`        |
| **Swagger UI**   | `https://eyesee11-b-ware.hf.space/docs`   |
| **Health check** | `https://eyesee11-b-ware.hf.space/health` |

Set in `backend/.env`:

```
NLP_SERVICE_URL=https://eyesee11-b-ware.hf.space
```

The trending cron job (`backend/jobs/trendingJob.js`) also calls this URL
directly for automated news verification — make sure it uses this value from
`process.env.NLP_SERVICE_URL`.

### Development (local — optional, for offline testing)

```bash
# From the project root
cd nlp-service

# Activate the shared venv (already set up)
& d:\delete\full_stack\venv\Scripts\Activate.ps1   # Windows
# source d:/delete/full_stack/venv/bin/activate    # Mac / Linux

# Start
uvicorn main:app --reload --port 5001
```

The service is now at **`http://localhost:5001`**. Switch `NLP_SERVICE_URL` in
`backend/.env` to `http://localhost:5001` while developing locally.

### Docker (self-hosted staging)

```bash
cd nlp-service
docker build -t bware-nlp .
docker run -p 5001:5001 --env-file .env bware-nlp
```

> First build takes ~10 min — it pre-downloads the 1.6 GB BART model inside
> the image so the first real request is instant.

---

## 2. Required Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` (copy from `backend/.env.example` and fill in):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bware
JWT_SECRET=generate_a_random_64_char_string
JWT_EXPIRES_IN=7d
NLP_SERVICE_URL=https://eyesee11-b-ware.hf.space
REDIS_URL=redis://localhost:6379
PORT=5000
```

> Use `NLP_SERVICE_URL=http://localhost:5001` when running the NLP service locally.

### NLP Service (`nlp-service/.env`) — already configured on HuggingFace

Only needed when running the NLP service locally. Copy `nlp-service/.env.example`
→ `nlp-service/.env`:

| Variable                    | Used by                            | Notes                       |
| --------------------------- | ---------------------------------- | --------------------------- |
| `GEMINI_API_KEY`            | `/verify/deep` (Tier 3)            | Free at aistudio.google.com |
| `NEWS_API_KEY`              | `/verify`, `/verify/deep` (Tier 2) | newsapi.org free plan       |
| `GOOGLE_FACT_CHECK_API_KEY` | `/verify`, `/verify/deep` (Tier 2) | Google Cloud console        |

The service starts without these keys — `GET /health` will show `status: "degraded"`
and Tier 2/3 evidence fetching will silently be skipped.

---

## 3. Install axios (if not already present)

```bash
cd backend
npm install axios
```

---

## 4. Recommended Helper Module

Create `backend/services/nlpService.js`:

```js
const axios = require("axios");

const NLP_BASE = process.env.NLP_SERVICE_URL || "http://localhost:5001";

const nlp = axios.create({
  baseURL: NLP_BASE,
  timeout: 35_000, // NLP deep verify can take up to 30 s
  headers: { "Content-Type": "application/json" },
});

// Central error normaliser — converts NLP HTTP errors into JS errors
nlp.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const detail = err.response?.data?.detail ?? err.message;
    const wrapped = new Error(`NLP service error [${status}]: ${detail}`);
    wrapped.status = status;
    wrapped.nlpDetail = detail;
    return Promise.reject(wrapped);
  },
);

module.exports = nlp;
```

Add `NLP_SERVICE_URL=https://eyesee11-b-ware.hf.space` to your backend's `.env` (use `http://localhost:5001` for local dev). Also add the key to `backend/.env.example` as a placeholder — it is not yet in that file.

---

## 5. Backend → NLP Service Call Pattern

All NLP calls from the backend follow this pattern:

1. **Check Redis dedup** — `GET claim_result:<md5(text)>` — if hit, return immediately
2. **Call NLP service** — choose the right endpoint based on user's request depth
3. **Persist to MySQL** — `INSERT/UPDATE claims` + `INSERT verification_log`
4. **Cache result** — `SET claim_result:<md5(text)> EX 86400` (24 h)

```
Backend endpoint  →  NLP endpoint called
──────────────────────────────────────────
POST /api/claims/verify  →  POST /verify        (full RAV pipeline)
POST /api/claims/quick   →  POST /verify/quick  (Tier 1 only, fastest)
POST /api/claims/deep    →  POST /verify/deep   (force all 3 tiers)
```

> ⚠️ Claim endpoints (`/api/claims/*`) require `Authorization: Bearer <JWT>`.  
> Auth routes (`/api/auth/*`) and trending routes (`/api/trending/*`) are public.

---

## 6. Endpoints Reference

### 6.1 Health Check

```
GET /health
```

**Use it to:** confirm the service is alive before any feature. Wire it into your
Node health-check route (`GET /api/health`).

```js
const nlp = require("./services/nlpService");

async function checkNlpHealth() {
  const { data } = await nlp.get("/health");
  return data;
}
```

**Response shape:**

```json
{
  "status": "degraded",
  "service": "B-ware NLP Service",
  "version": "1.0.0",
  "bart_model": "not_loaded",
  "gemini_key": "configured",
  "newsapi_key": "missing",
  "factcheck_key": "configured"
}
```

- `status: "healthy"` → all API keys configured
- `status: "degraded"` → at least one key missing (Tier 2/3 may skip that source)
- `bart_model: "loaded"` → BART is warm in memory; loaded on demand the first time any claim reaches Tier 2 (i.e. the first `/verify` or `/verify/deep` call that escalates past Tier 1)

---

### 6.2 Extract — single claim

```
POST /extract
```

**Use it to:** extract metric, value, year, and confidence from one sentence.
Good for pre-processing before storing a claim.

```js
async function extractClaim(text) {
  const { data } = await nlp.post("/extract", { text });
  return data;
}
```

**Request:**

```json
{ "text": "India's GDP growth rate stood at 7.5 percent in 2024" }
```

**Response:**

```json
{
  "original_text": "India's GDP growth rate stood at 7.5 percent in 2024",
  "metric": "GDP growth rate",
  "value": 7.5,
  "year": 2024,
  "value_type": "percentage",
  "confidence": 0.9
}
```

| Field        | Type                                 | Notes                                            |
| ------------ | ------------------------------------ | ------------------------------------------------ |
| `metric`     | `string \| null`                     | One of the 10 supported metrics, or `null`       |
| `value`      | `number \| null`                     | Extracted numeric value (word-forms resolved)    |
| `year`       | `number \| null`                     | Fiscal year support: FY2024-25 → 2025            |
| `value_type` | `"percentage" \| "absolute" \| null` | Use to pick the right comparison logic           |
| `confidence` | `0.0 – 1.0`                          | 0.9 = strong, 0.6 = partial, 0.0 = nothing found |

**Validation errors (422):**

- `text` shorter than 3 chars or longer than 2000 chars
- Non-English text detected → `"Only English claims are supported. Detected language: 'hi'."`

---

### 6.3 Batch Extract — up to 50 claims

```
POST /batch
```

**Use it to:** process many pre-split claim sentences (e.g., from a CSV import).

```js
async function batchExtract(claims) {
  // claims: string[] — max 50
  const { data } = await nlp.post("/batch", { claims });
  return data.results; // ExtractionResponse[]
}
```

**Request:**

```json
{
  "claims": [
    "India's GDP growth rate stood at 7.5 percent in 2024",
    "Inflation came down to 4.8% in January 2024"
  ]
}
```

**Response:**

```json
{
  "results": [
    {
      "original_text": "...",
      "metric": "GDP growth rate",
      "value": 7.5,
      "year": 2024,
      "value_type": "percentage",
      "confidence": 0.9
    },
    {
      "original_text": "...",
      "metric": "inflation rate",
      "value": 4.8,
      "year": 2024,
      "value_type": "percentage",
      "confidence": 0.9
    }
  ],
  "total": 2
}
```

Individual claim failures return a zeroed-out result (`confidence: 0.0`) so the
whole batch never crashes.

---

### 6.4 Analyze — full paragraph

```
POST /analyze
```

**Use it to:** let the user paste a full paragraph and automatically split,
score, and extract all verifiable claims inside it.

```js
async function analyzeParagraph(text) {
  const { data } = await nlp.post("/analyze", { text });
  // data.results = array of { sentence, claim_probability, extraction }
  return data;
}
```

**Request:**

```json
{
  "text": "India's GDP growth stood at 7.5% in 2024. Inflation fell to 4.8%. The sky is blue."
}
```

**Response:**

```json
{
  "total_sentences": 3,
  "verified_count": 2,
  "high_confidence_count": 1,
  "results": [
    {
      "sentence": "India's GDP growth stood at 7.5% in 2024",
      "claim_probability": 0.95,
      "extraction": {
        "original_text": "India's GDP growth stood at 7.5% in 2024",
        "metric": "GDP growth rate",
        "value": 7.5,
        "year": 2024,
        "value_type": "percentage",
        "confidence": 0.9
      }
    },
    {
      "sentence": "Inflation fell to 4.8%",
      "claim_probability": 0.65,
      "extraction": {
        "metric": "inflation rate",
        "value": 4.8,
        "year": null,
        "confidence": 0.48
      }
    }
  ]
}
```

> `"The sky is blue."` scores < 0.5 claim probability and is filtered out.  
> Non-English text → HTTP 422 with a descriptive error.

---

### 6.5 Metrics list

```
GET /metrics
```

Returns the 10 supported metric names. Wire into a dropdown or validation check.

```js
const { data } = await nlp.get("/metrics");
// data.supported_metrics: string[]
// data.count: 10
```

---

### 6.6 Quick Verify — Tier 1 only (fastest)

```
POST /verify/quick
```

**Use it to:** banner-check a numeric claim against World Bank data in ~0.5–2 s.
Best for: "India's GDP growth rate was X% in Y."

```js
async function quickVerify(text) {
  const { data } = await nlp.post("/verify/quick", { text });
  return data;
}
```

**Response:**

```json
{
  "original_text": "India's GDP growth rate was 7.5% in 2024",
  "tier_used": "tier1",
  "verdict": "misleading",
  "confidence": 0.55,
  "extraction": {
    "metric": "GDP growth rate",
    "value": 7.5,
    "year": 2024,
    "value_type": "percentage",
    "confidence": 0.9
  },
  "numeric_check": {
    "official_value": 6.49,
    "claimed_value": 7.5,
    "percentage_error": 15.48,
    "source": "World Bank",
    "indicator_code": "NY.GDP.MKTP.KD.ZG",
    "source_url": "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=IN",
    "year": 2024
  },
  "explanation": "Claimed 7.5 for 'GDP growth rate' in 2024. Official World Bank value: 6.4900. ..."
}
```

**Verdict values:**

| Verdict        | Meaning                                                |
| -------------- | ------------------------------------------------------ |
| `accurate`     | % error < 5%                                           |
| `misleading`   | % error 5–20%                                          |
| `false`        | % error ≥ 20%                                          |
| `unverifiable` | metric/value/year not extracted, or no World Bank data |

---

### 6.7 Full Verify — Tier 1 + 2 + 3 (recommended for production)

```
POST /verify
```

Runs the full RAV pipeline: stops at the earliest tier that is confident enough.
Typical latency: 1–5 s.

```js
async function fullVerify(text) {
  const { data } = await nlp.post("/verify", { text });
  return data;
}
```

**Response shape:** same as `/verify/quick` but adds:

```json
{
  "tier_used": "tier2",
  "extracted_metric": "GDP growth rate",
  "extracted_value": 7.5,
  "extracted_year": 2024,
  "extraction_confidence": 0.9,
  "official_value": 6.49,
  "percentage_error": 15.48,
  "official_source": "World Bank",
  "indicator_code": "NY.GDP.MKTP.KD.ZG",
  "source_url": "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=IN",
  "evidence": [
    {
      "source": "Reuters",
      "snippet": "India GDP growth accelerated...",
      "url": "https://reuters.com/...",
      "evidence_type": "news",
      "nli_verdict": "entailment",
      "nli_score": 0.82
    }
  ],
  "tiers_run": ["tier1", "tier2"],
  "explanation": "..."
}
```

> **Input preprocessing:** before routing, both `/verify` and `/verify/deep` automatically run `preprocess_claim()` on the submitted text — stripping HTML tags, removing zero-width Unicode chars, collapsing whitespace, and applying NFC normalisation. You do not need to clean the text before sending it.

---

### 6.8 Deep Verify — forces all 3 tiers

```
POST /verify/deep
```

Forces Tier 1 + 2 + 3 regardless of confidence. Slowest (~3–8 s). Use only for
high-stakes claims. **Rate limited: 10 requests / minute per IP.**

Like `/verify`, input is automatically preprocessed via `preprocess_claim()` (HTML strip, whitespace normalisation, Unicode NFC) before the pipeline runs.

```js
async function deepVerify(text) {
  const { data } = await nlp.post("/verify/deep", { text });
  return data; // same shape as /verify; tiers_run always includes all three
}
```

Handle `HTTP 429` (rate limit exceeded) in your caller:

```js
try {
  return await deepVerify(text);
} catch (err) {
  if (err.status === 429) {
    // Fall back to /verify instead
    return await fullVerify(text);
  }
  throw err;
}
```

---

## 7. Wiring All Features — Node.js Route Examples

### Claim submission → extract + store

```js
// POST /api/claims
router.post("/claims", async (req, res) => {
  try {
    const { text } = req.body;

    // 1. Extract structured fields from the NLP service
    const extraction = await extractClaim(text);

    // 2. Store raw claim + extraction in your DB
    const claim = await db.claims.create({
      raw_text: text,
      metric: extraction.metric,
      value: extraction.value,
      year: extraction.year,
      value_type: extraction.value_type,
      confidence: extraction.confidence,
    });

    res.status(201).json({ claim_id: claim.id, extraction });
  } catch (err) {
    if (err.status === 422)
      return res.status(422).json({ error: err.nlpDetail });
    res.status(500).json({ error: "Could not process claim" });
  }
});
```

### Paragraph analysis (user pastes a block of text)

```js
// POST /api/analyze
router.post("/analyze", async (req, res) => {
  const { text } = req.body;
  const result = await analyzeParagraph(text);
  // result.results is an array of { sentence, claim_probability, extraction }
  res.json({
    found: result.verified_count,
    total: result.total_sentences,
    high_conf: result.high_confidence_count,
    claims: result.results.map((r) => ({
      sentence: r.sentence,
      probability: r.claim_probability,
      ...r.extraction, // metric, value, year, value_type, confidence
    })),
  });
});
```

### Fact-check a stored claim

```js
// POST /api/claims/:id/verify
router.post("/claims/:id/verify", async (req, res) => {
  const claim = await db.claims.findByPk(req.params.id);
  if (!claim) return res.status(404).json({ error: "Not found" });

  const result = await fullVerify(claim.raw_text);

  await db.verification_log.create({
    claim_id: claim.id,
    verdict: result.verdict,
    confidence: result.confidence,
    tier_used: result.tier_used,
    tiers_run: JSON.stringify(result.tiers_run),
    explanation: result.explanation,
  });

  res.json(result);
});
```

---

## 8. Error Handling Reference

| HTTP status    | Meaning                    | What to do                                                    |
| -------------- | -------------------------- | ------------------------------------------------------------- |
| `200`          | Success                    | Use the response                                              |
| `422`          | Validation error           | Show `detail` to the user (e.g., non-English, text too short) |
| `429`          | Rate limit (deep verify)   | Back off and retry, or fall back to `/verify`                 |
| `500`          | NLP service internal error | Log `detail`, show generic error to user                      |
| `ECONNREFUSED` | NLP service is down        | Return 503 to frontend; alert on-call                         |

Axios timeout (`35_000 ms`) fires as `ECONNABORTED` — treat it the same as 500.

---

## 9. CORS

The NLP service currently allows origins:

- `http://localhost:3000` (React dev server)
- `http://localhost:5000` (Node backend)
- `http://localhost:5500` (VS Code Live Server)

Node-to-NLP calls are **server-to-server** — CORS does not apply there. CORS only
affects calls made directly from a browser to the NLP service, which you should
avoid in production (all NLP calls should flow through Node).

---

## 10. Supported Metrics (10)

| Metric name               | `value_type` | World Bank indicator |
| ------------------------- | ------------ | -------------------- |
| GDP growth rate           | percentage   | NY.GDP.MKTP.KD.ZG    |
| inflation rate            | percentage   | FP.CPI.TOTL.ZG       |
| unemployment rate         | percentage   | SL.UEM.TOTL.ZS       |
| fiscal deficit            | percentage   | GC.BAL.CASH.GD.ZS    |
| literacy rate             | percentage   | SE.ADT.LITR.ZS       |
| population                | absolute     | SP.POP.TOTL          |
| per capita income         | absolute     | NY.GDP.PCAP.CD       |
| poverty rate              | percentage   | SI.POV.DDAY          |
| foreign exchange reserves | absolute     | FI.RES.TOTL.CD       |
| current account deficit   | percentage   | BN.CAB.XOKA.GD.ZS    |

Use `GET /metrics` to get the list at runtime (stays in sync automatically).

---

## 11. Multi-country Support

The NLP service auto-detects the country from claim text.  
Currently supported: India, USA, UK, China, Japan, Germany, France, Brazil,
Canada, Australia, South Korea.

Examples the detector handles:

- `"India's GDP..."` → `IND`
- `"US GDP grew..."` → `USA`
- `"UK unemployment..."` → `GBR`

Unrecognised countries default to `IND`.

---

## 12. Redis Keys Used by the Backend (NLP-related)

| Key pattern              | TTL    | Set by               | Purpose                                   |
| ------------------------ | ------ | -------------------- | ----------------------------------------- |
| `claim_result:<md5hash>` | 24 h   | `claimController`    | Dedup — skip NLP call for repeated claims |
| `trending_feed`          | 5 min  | `trendingController` | Cache `GET /api/trending` response        |
| `stats_cache`            | 10 min | `claimController`    | Cache dashboard aggregate stats           |

The NLP service also has its own internal L1 cache (`_ResultCache`, 1 h TTL,
keyed on MD5 + `force_tier3`). Redis is the L2 cache sitting in the backend
before any request reaches the NLP service at all.
