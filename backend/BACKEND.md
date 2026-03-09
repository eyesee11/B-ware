# B-ware Backend

> NLP service is deployed at `https://eyesee11-b-ware.hf.space`
> This document covers the Node.js API that sits between the React frontend and the NLP service.

---

## What it does

User submits a claim like `"India GDP was 7.5% in 2024"`.

1. Backend checks Redis -- if this exact claim was verified in the last 24h, return cached result instantly.
2. Calls NLP service on HuggingFace -- it extracts the metric, finds official data, runs NLI/LLM as needed.
3. Saves verdict and evidence to MySQL.
4. Returns the result to the frontend.

The NLP does all the smart work. The backend handles auth, caching, DB storage, and routing.

---

## Stack

| Package                               | Use                                       |
| ------------------------------------- | ----------------------------------------- |
| Express 5                             | HTTP server and routing                   |
| MySQL2 (mysql2/promise)               | Users, claims, verdicts                   |
| ioredis                               | Cache, JWT blacklist, rate-limit counters |
| jsonwebtoken                          | Stateless auth with logout support (jti)  |
| bcryptjs                              | Password hashing (cost 10)                |
| axios                                 | HTTP calls to NLP service (60s timeout)   |
| express-rate-limit + rate-limit-redis | 100 req / 15 min per IP, backed by Redis  |
| node-cron                             | Fetch + verify trending news every 30 min |
| dotenv                                | Load .env on startup                      |

---

## Folder structure

```
backend/
  server.js                   entry point, middleware, routes, graceful shutdown
  .env                        secrets -- never commit
  config/
    db.js                     MySQL pool (10 connections)
    redis.js                  ioredis client with retry strategy
  middleware/
    auth.js                   JWT verify + Redis blacklist check
  controllers/
    authController.js         register / login / logout / me
    claimController.js        verify / quick / deep / history / stats
    trendingController.js     trending feed, source stats, admin refresh
  routes/
    authRoutes.js
    claimRoutes.js
    trendingRoutes.js
  services/
    nlpService.js             axios instance pre-configured for NLP service
  jobs/
    trendingJob.js            cron: fetch trending news, call NLP, save to DB
  seeders/
    worldBankSeeder.js        seed official_data_cache from World Bank API
```

---

## Data flow

```
Browser (React :3000)
  |  POST /api/claims/verify  { "text": "India GDP was 7.5%" }
  |  Authorization: Bearer <jwt>
  v
Express (:5000)
  |-- auth.js             verify JWT signature, check Redis blacklist
  |-- Redis               claim_result:<md5>  cached? -> return instantly
  |-- MySQL               INSERT claims (status=pending)
  |-- POST https://eyesee11-b-ware.hf.space/verify
  |          ^--- NLP service (HuggingFace Spaces)
  |-- MySQL               INSERT verification_log, UPDATE claims (status=verified)
  |-- Redis               SET claim_result:<md5>  EX 86400
  +-- return verdict JSON to browser
```

---

## Environment variables (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bware_ai

JWT_SECRET=any_long_random_string_32_plus_chars
JWT_EXPIRES_IN=7d

NLP_SERVICE_URL=https://eyesee11-b-ware.hf.space
REDIS_URL=redis://localhost:6379
PORT=5000

FRONTEND_URL=http://localhost:3000   # CORS allowed origin
NEWS_API_KEY=                        # optional -- trending skips news fetch if empty
```

---

## How to start

### 1. Start Redis (Docker)

```bash
docker start redis
# or first-time setup:
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 2. Start the backend

```bash
cd backend
npm run dev       # nodemon -- auto-reloads on save (development)
node server.js    # production
```

Expected startup output:

```
trending cron scheduled (every 30 min)
B-ware backend -> http://localhost:5000
Redis connected
MySQL connected
```

### 3. Seed reference data (run once)

```bash
cd backend
npm run seed
```

This fetches 8 India economic indicators from the World Bank API and loads them into `official_data_cache` so Tier-1 numeric checks have reference data.

---

## API routes

Base path: `http://localhost:5000`

### Health

| Method | Route         | Auth | Description                |
| ------ | ------------- | ---- | -------------------------- |
| GET    | `/api/health` | No   | Returns MySQL/Redis status |

**Response:**

```json
{ "status": "healthy", "mysql": "ok", "redis": "ok", "timestamp": "2026-..." }
```

---

### Auth -- `/api/auth`

| Method | Route       | Auth | Description                        |
| ------ | ----------- | ---- | ---------------------------------- |
| POST   | `/register` | No   | Create account, returns JWT + user |
| POST   | `/login`    | No   | Login, returns JWT + user          |
| POST   | `/logout`   | Yes  | Blacklists token in Redis          |
| GET    | `/me`       | Yes  | Returns current user profile       |

**POST /register / /login body:**

```json
{ "email": "you@example.com", "password": "Test1234!", "name": "Your Name" }
```

**Response:**

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Your Name",
    "email": "you@example.com",
    "role": "user"
  }
}
```

**Validation:**

- email must be valid format, max 120 chars
- password 8-128 chars
- name 1-80 chars
- login returns `401` with same error message for wrong email or wrong password (no user enumeration)

---

### Claims -- `/api/claims`

All routes require `Authorization: Bearer <token>`.

| Method | Route     | Description                                                  |
| ------ | --------- | ------------------------------------------------------------ |
| POST   | `/verify` | Full 3-tier verification (tier1 -> tier2 -> tier3 if needed) |
| POST   | `/quick`  | Tier1 + Tier2 only (no LLM call)                             |
| POST   | `/deep`   | Same as /verify but forces tier3 LLM reasoning               |
| GET    | `/stats`  | Verdict counts + avg confidence for the user                 |
| GET    | `/`       | Paginated claim history (newest first)                       |
| GET    | `/:id`    | Single claim with full verification log and evidence         |

**Verify body:**

```json
{ "text": "India GDP growth rate was 8.2% in 2023" }
```

**Verify response:**

```json
{
  "claim_id": 1,
  "original_text": "India GDP growth rate was 8.2% in 2023",
  "verdict": "accurate",
  "confidence": 0.91,
  "tier_used": "tier1",
  "tiers_run": ["tier1"],
  "explanation": "Official World Bank value for gdp_growth_rate in 2023 is 8.15%. Claimed value 8.2% is within 1% tolerance.",
  "official_value": 8.15,
  "claimed_value": 8.2,
  "percentage_error": 0.61,
  "extracted_metric": "gdp_growth_rate",
  "extracted_year": 2023,
  "evidence": [],
  "source_url": null,
  "from_cache": false
}
```

**Verdicts:** `accurate` | `misleading` | `false` | `unverifiable`

**Validation:** min 5 chars, max 2000 chars.
**Dedup:** identical claim text (MD5 hash) returns cached result with `"from_cache": true`, no NLP call.

**GET / query params:** `?page=1&limit=20` (max limit 50)

**Stats response:**

```json
{
  "total": 12,
  "avg_confidence": "0.74",
  "accurate": 5,
  "misleading": 3,
  "false": 2,
  "unverifiable": 2
}
```

---

### Trending -- `/api/trending`

Public routes (no auth required).

| Method | Route      | Auth  | Description                                     |
| ------ | ---------- | ----- | ----------------------------------------------- |
| GET    | `/`        | No    | Trending stories sorted by danger score         |
| GET    | `/sources` | No    | Source reliability stats (claim counts, scores) |
| GET    | `/:id`     | No    | Single story with full detail                   |
| POST   | `/refresh` | Admin | Trigger immediate news fetch + verify cycle     |

**GET / query params:** `?filter=all|false|misleading&limit=20`

**Trending story shape:**

```json
{
  "id": 1,
  "headline": "India achieves record GDP growth",
  "claim_text": "India GDP growth is 10% this year",
  "verdict": "false",
  "danger_score": 95,
  "confidence": 0.88,
  "source_name": "example-news.com",
  "source_url": "https://...",
  "published_at": "2026-03-07T10:00:00Z"
}
```

**POST /refresh:** requires `role: admin` in JWT. Returns 403 for regular users.

---

## Redis keys

| Key                      | TTL                        | Content                                |
| ------------------------ | -------------------------- | -------------------------------------- |
| `claim_result:<md5>`     | 24 hours                   | Full verify response JSON              |
| `jwt_blacklist:<jti>`    | Token's remaining lifetime | Value `"1"` -- presence = rejected     |
| `session:<userId>`       | 7 days                     | Active session marker                  |
| `stats_cache:<userId>`   | 10 minutes                 | Claim stats aggregate JSON             |
| `trending_feed:<filter>` | 5 minutes                  | Trending feed response JSON            |
| `trending_job_lock`      | 5 minutes                  | Cron run lock (NX) -- prevents overlap |

---

## How claim deduplication works

Every claim text is MD5 hashed (trimmed + lowercased). Before calling NLP:

- **Cache hit** --> return immediately. `from_cache: true` in response. No DB write, no NLP call.
- **Cache miss** --> call NLP, save to MySQL, cache result for 24 hours.

The `verification_log` dedup also uses `MD5(source_url)` to avoid duplicate source entries.

---

## How JWT logout works

Every JWT token contains a `jti` (UUID). On logout:

1. Decode the token to get `jti` and `exp`.
2. Calculate remaining TTL = `exp - now`.
3. `SET jwt_blacklist:<jti> 1 EX <ttl>` in Redis.
4. `auth.js` checks `jwt_blacklist:<jti>` on every protected request. If key exists -> 401.

The Redis key auto-expires when the token would have expired anyway. No cleanup needed.

---

## Danger score formula (trending)

```
base score:
  false         -> 80
  misleading    -> 40
  unverifiable  -> 15
  accurate      ->  0

score = base + (confidence * 20) + recency_bonus
recency_bonus = +10 if published < 2 hours ago
                +5  if published < 24 hours ago
                 0  otherwise

capped at 100
```

---

## Database

Database: `bware_ai` -- 9 tables

```sql
users
  id, name, email, password_hash, role (user|admin), created_at

claims
  id, user_id, original_text, claim_hash (MD5),
  extracted_metric, extracted_value, extracted_year,
  verdict, confidence, status (pending|verified|failed), created_at

verification_log
  id, claim_id, official_value, claimed_value, difference, percentage_error,
  verdict, tier_used, tiers_run (JSON), confidence,
  explanation, evidence_json (JSON), verified_at

evidence_snippets
  id, claim_id, source, title, snippet, url, relevance_score

nli_results
  id, claim_id, evidence_id, nli_label, nli_score

tier3_results
  id, claim_id, verdict, explanation, raw_response, created_at

trending_stories
  id, headline, claim_text, verdict, confidence, danger_score,
  source_name, source_url, published_at, is_active, last_verified_at

source_stats
  id, source_name, source_domain, total_claims,
  avg_danger_score, false_count, misleading_count, accurate_count

official_data_cache
  id, metric_name, year, value, source, last_updated
  UNIQUE (metric_name, year)
```

**Create schema:**

```bash
mysql -u root -p bware_ai < database/bware_ai_schema.sql
```

---

## NLP integration

The NLP service runs on HuggingFace Spaces at `https://eyesee11-b-ware.hf.space`.

- `POST /verify` -- full 3-tier pipeline
- `POST /verify/quick` -- tier1 + tier2 (no LLM)
- `POST /verify/deep` -- forces tier3 LLM

All expect: `{ "text": "<claim string>" }`

The service has a 60-second timeout configured in `nlpService.js` to handle HuggingFace cold starts (free tier can take 30-50s to wake up). Do not reduce this.

---

## Trending cron job

`jobs/trendingJob.js` runs every 30 minutes via `node-cron`.

1. Tries `SET trending_job_lock NX EX 300` in Redis. Skips run if key exists (another instance running).
2. Calls `trendingController.runTrendingRefresh()`.
3. Fetches headlines from NewsAPI (skipped if `NEWS_API_KEY` empty).
4. For each story, calls NLP `/verify`, computes danger score, upserts into `trending_stories`.
5. Updates `source_stats` with running avg of danger scores.
6. Clears `trending_feed:*` cache keys.

---

## Scripts

```bash
npm start       # node server.js
npm run dev     # nodemon server.js (development)
npm run seed    # node seeders/worldBankSeeder.js
```
