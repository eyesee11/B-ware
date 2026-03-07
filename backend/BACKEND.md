# B-ware Backend

> NLP service is done and deployed at `https://eyesee11-b-ware.hf.space` â€” don't touch it.  
> Your job: the Node.js API between React frontend and the NLP service.

---

## What it does

User types a claim like `"India GDP was 7.5% in 2024"` in the browser.

1. Backend checks Redis â€” if this claim was verified in the last 24h, return cached result instantly
2. Calls NLP service on Hugging Face â€” it extracts the metric, finds official data, runs NLI/LLM if needed
3. Saves verdict + evidence to MySQL
4. Returns the result to the frontend

The NLP does all the smart work. This backend handles auth, caching, DB storage, and routing.

---

## Stack

| Package                               | Use                                       |
| ------------------------------------- | ----------------------------------------- |
| Express 5                             | HTTP server + routing                     |
| MySQL2                                | Store users, claims, verdicts             |
| ioredis                               | Cache, JWT blacklist, rate limit counters |
| jsonwebtoken                          | Stateless auth with logout support (jti)  |
| bcryptjs                              | Password hashing                          |
| axios                                 | HTTP calls to NLP service                 |
| express-rate-limit + rate-limit-redis | 100 req/15min per IP                      |
| node-cron                             | Fetch + verify trending news every 30 min |

---

## Folder structure

```
backend/
â”œâ”€â”€ server.js                   entry point
â”œâ”€â”€ .env                        secrets â€” never commit
â”œâ”€â”€ config/
â”‚   â”œâ”€â”€ db.js                   MySQL pool (10 connections)
â”‚   â””â”€â”€ redis.js                ioredis client
â”œâ”€â”€ middleware/
â”‚   â””â”€â”€ auth.js                 JWT verify + blacklist check
â”œâ”€â”€ controllers/
â”‚   â”œâ”€â”€ authController.js       register / login / logout / me
â”‚   â”œâ”€â”€ claimController.js      verify / history / stats
â”‚   â””â”€â”€ trendingController.js   trending feed + danger scores
â”œâ”€â”€ routes/
â”‚   â”œâ”€â”€ authRoutes.js
â”‚   â”œâ”€â”€ claimRoutes.js
â”‚   â””â”€â”€ trendingRoutes.js
â”œâ”€â”€ services/
â”‚   â””â”€â”€ nlpService.js           axios wrapper to call NLP on HF
â””â”€â”€ jobs/
    â””â”€â”€ trendingJob.js          cron: fetch news â†’ verify â†’ save
```

---

## Data flow

```
Browser (React :3000)
  â”‚  POST /api/claims/verify  { text: "India GDP was 7.5%" }
  â”‚  Authorization: Bearer <token>
  â–¼
Express (:5000)
  â”œâ”€ auth.js          verify JWT, check Redis blacklist
  â”œâ”€ Redis            claim_result:<md5> cached? â†’ return instantly
  â”œâ”€ MySQL            INSERT claims (status pending)
  â”œâ”€ POST https://eyesee11-b-ware.hf.space/verify
  â”‚       â†• NLP service (Hugging Face)
  â”œâ”€ MySQL            INSERT verification_log, UPDATE claims
  â”œâ”€ Redis            SET claim_result:<md5> EX 86400
  â””â”€ return verdict to browser
```

---

## Environment variables (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bware_ai

JWT_SECRET=any_long_random_string_32plus_chars
JWT_EXPIRES_IN=7d

NLP_SERVICE_URL=https://eyesee11-b-ware.hf.space
REDIS_URL=redis://localhost:6379
PORT=5000

# optional â€” needed for trending news fetch
NEWS_API_KEY=
FRONTEND_URL=http://localhost:3000
```

---

## API routes

### Auth â€” `/api/auth`

| Method | Route       | Auth | Description                 |
| ------ | ----------- | ---- | --------------------------- |
| POST   | `/register` | No   | Create account, returns JWT |
| POST   | `/login`    | No   | Login, returns JWT          |
| POST   | `/logout`   | Yes  | Invalidates token in Redis  |
| GET    | `/me`       | Yes  | Get current user info       |

### Claims â€” `/api/claims`

| Method | Route     | Auth | Description                        |
| ------ | --------- | ---- | ---------------------------------- |
| POST   | `/verify` | Yes  | Full 3-tier verification           |
| POST   | `/quick`  | Yes  | Tier 1 only (numeric check)        |
| POST   | `/deep`   | Yes  | Forces NLI + LLM tiers             |
| GET    | `/stats`  | Yes  | Verdict counts + avg confidence    |
| GET    | `/`       | Yes  | Paginated claim history            |
| GET    | `/:id`    | Yes  | Single claim with verification log |

### Trending â€” `/api/trending`

| Method | Route      | Auth  | Description                              |
| ------ | ---------- | ----- | ---------------------------------------- |
| GET    | `/`        | No    | Trending stories, sorted by danger score |
| GET    | `/sources` | No    | Source reliability leaderboard           |
| GET    | `/:id`     | No    | Single story detail                      |
| POST   | `/refresh` | Admin | Trigger manual news fetch                |

### Health

| Method | Route         | Description                  |
| ------ | ------------- | ---------------------------- |
| GET    | `/api/health` | Returns MySQL + Redis status |

---

## Redis keys

| Key                      | TTL                        | What it stores                                 |
| ------------------------ | -------------------------- | ---------------------------------------------- |
| `claim_result:<md5>`     | 24h                        | Full verify response â€” skip NLP on duplicate |
| `jwt_blacklist:<jti>`    | token's remaining lifetime | Marks logged-out tokens                        |
| `session:<userId>`       | 7d                         | Active session marker                          |
| `stats_cache:<userId>`   | 10min                      | Claim stats aggregate                          |
| `trending_feed:<filter>` | 5min                       | Trending feed cache                            |
| `trending_job_lock`      | 5min                       | Cron lock â€” prevents overlap                 |

---

## How the claim cache works

Every claim text gets MD5 hashed. Before calling NLP, we check `claim_result:<hash>` in Redis.

- Hit â†’ return immediately, `from_cache: true` in response, no DB write
- Miss â†’ call NLP â†’ save to MySQL â†’ store in Redis for 24h

---

## How JWT logout works

JWT tokens include a `jti` (unique ID per token). On logout:

1. Calculate remaining TTL of the token
2. `SET jwt_blacklist:<jti> 1 EX <ttl>` in Redis
3. `auth.js` middleware checks this key on every request â€” rejected if found

The key auto-expires when the token would have expired anyway, so no cleanup needed.

---

## Danger score formula (trending)

```
base  = falseâ†’80, misleadingâ†’40, unverifiableâ†’15, accurateâ†’0
score = base + confidenceÃ—20 + recency_bonus
recency = +10 if <2h old, +5 if <24h old
capped at 100
```

---

## Start the server

```bash
cd backend
npm run dev       # uses nodemon, auto-restarts on save
# or
node server.js    # production style
```

Server logs on startup:

```
MySQL connected
Redis connected
trending cron scheduled (every 30 min)
B-ware backend â†’ http://localhost:5000
```

---

## Database

Database: `bware_ai` â€” 9 tables

```
users               id, name, email, password_hash, role
claims              id, user_id, original_text, claim_hash, verdict, confidence, status
verification_log    claim_id, verdict, tier_used, confidence, evidence_json, explanation
evidence_snippets   claim_id, source, title, snippet, url
nli_results         claim_id, evidence_id, nli_label, nli_score
tier3_results       claim_id, verdict, explanation, raw_response
trending_stories    headline, claim_text, verdict, danger_score, is_active
source_stats        source_name, total_claims, avg_danger_score
official_data_cache metric_name, year, value, source
```

Setup (already done, bware_ai exists):

```bash
Get-Content database/bware_ai_schema.sql | mysql -u root -p
```
