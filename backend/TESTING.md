# B-ware Backend — Testing Guide

> All tests below use PowerShell. Same requests work in Postman — just translate the body/headers.  
> Start the server first: `cd backend && npm run dev`

---

## 0. Before you start

```powershell
# Check everything is up
Invoke-RestMethod http://localhost:5000/api/health | ConvertTo-Json
```

Expected:
```json
{ "status": "healthy", "mysql": "ok", "redis": "ok" }
```

If `mysql` or `redis` is `"down"`, fix that first — don't test further.

---

## 1. Auth

### Register

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/auth/register `
  -Method POST `
  -ContentType 'application/json' `
  -Body '{"name":"Deepanshu","email":"deep@test.com","password":"test1234"}'
```

Expected: `201` with `token` and `user` object.

Same email again → `409 Email already registered`.  
Password under 6 chars → `400`.

---

### Login + save token

```powershell
$r = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login `
  -Method POST -ContentType 'application/json' `
  -Body '{"email":"deep@test.com","password":"test1234"}'

$TOKEN = $r.token
Write-Host "Token saved"
```

Wrong password → `401 Invalid email or password`.

---

### Get current user

```powershell
Invoke-RestMethod http://localhost:5000/api/auth/me `
  -Headers @{ Authorization = "Bearer $TOKEN" }
```

No token → `401 No token provided`.  
Bad/expired token → `401 Invalid or expired token`.

---

### Logout + verify blacklist

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/auth/logout `
  -Method POST -Headers @{ Authorization = "Bearer $TOKEN" }

# same token should now be rejected
try {
  Invoke-RestMethod http://localhost:5000/api/auth/me `
    -Headers @{ Authorization = "Bearer $TOKEN" }
} catch {
  Write-Host "Got:" $_.Exception.Response.StatusCode.value__  # expect 401
}
```

---

## 2. Claims

> ⚠️ First request to NLP may take **30–50 seconds** — Hugging Face cold start.  
> After that, responses are fast. Duplicate claims return from Redis cache instantly.

Login first and save `$TOKEN` (see above).

---

### Submit a claim (standard)

```powershell
$claim = Invoke-RestMethod -Uri http://localhost:5000/api/claims/verify `
  -Method POST -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"text":"India GDP growth was 8.2 percent in 2023"}'

$claim | ConvertTo-Json -Depth 3
```

Expected response fields:
```
claim_id          int
verdict           "accurate" | "misleading" | "false" | "unverifiable"
confidence        0.0 – 1.0
tier_used         "tier1" | "tier2" | "tier3"
explanation       text
official_value    number (World Bank data)
claimed_value     number (extracted from your text)
percentage_error  number
extracted_metric  "GDP growth rate" etc
extracted_year    2023 etc
evidence          array
source_url        World Bank / Wikipedia URL
```

---

### Quick verify (tier 1 only — faster)

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/claims/quick `
  -Method POST -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"text":"India inflation was 4 percent in 2022"}'
```

---

### Deep verify (forces all 3 tiers — slowest)

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/claims/deep `
  -Method POST -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"text":"India unemployment rate was 7.8 percent in 2023"}'
```

---

### Test Redis cache

Submit the exact same text twice — second call should return instantly with `from_cache: true`.

```powershell
$a = Invoke-RestMethod -Uri http://localhost:5000/api/claims/quick `
  -Method POST -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"text":"India GDP growth was 8.2 percent in 2023"}'

Write-Host "from_cache:" $a.from_cache   # should be True
```

---

### Claim history

```powershell
Invoke-RestMethod "http://localhost:5000/api/claims" `
  -Headers @{ Authorization = "Bearer $TOKEN" } | ConvertTo-Json -Depth 2
```

With pagination:
```powershell
Invoke-RestMethod "http://localhost:5000/api/claims?page=1&limit=5" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
```

---

### Single claim detail

```powershell
# replace 1 with your actual claim_id from the verify response
Invoke-RestMethod "http://localhost:5000/api/claims/1" `
  -Headers @{ Authorization = "Bearer $TOKEN" } | ConvertTo-Json -Depth 4
```

Returns full claim joined with `verification_log` — includes `evidence_json`, `tiers_run`, `explanation`.

---

### Stats

```powershell
Invoke-RestMethod "http://localhost:5000/api/claims/stats" `
  -Headers @{ Authorization = "Bearer $TOKEN" }
```

Expected:
```json
{ "total": 3, "accurate": 1, "misleading": 1, "false": 0, "unverifiable": 1, "avg_confidence": "0.78" }
```

---

## 3. Trending

No auth needed for read endpoints.

```powershell
# all trending stories
Invoke-RestMethod http://localhost:5000/api/trending | ConvertTo-Json

# filter by verdict
Invoke-RestMethod "http://localhost:5000/api/trending?verdict=false" | ConvertTo-Json

# source stats leaderboard
Invoke-RestMethod http://localhost:5000/api/trending/sources | ConvertTo-Json

# single story
Invoke-RestMethod http://localhost:5000/api/trending/1 | ConvertTo-Json
```

> Trending stories are empty until either the cron job runs (every 30 min) or you trigger a manual refresh.

---

## 4. NLP service connection tests

These test the connection between your backend and the NLP service on Hugging Face directly.

### Check NLP is reachable

```powershell
Invoke-RestMethod https://eyesee11-b-ware.hf.space/health
```

Expected: `{ "status": "ok" }` or similar. If it times out, the HF space is sleeping — first claim verify will wake it up (takes 30–50s).

---

### Test tier 1 — numeric check

Claims with clear numbers go through tier 1 (fast, ~2s once warm).

```powershell
$r = Invoke-RestMethod -Uri http://localhost:5000/api/claims/quick `
  -Method POST -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"text":"India GDP growth rate was 6.1 percent in 2022"}'

Write-Host "tier_used:" $r.tier_used           # tier1
Write-Host "official:" $r.official_value
Write-Host "claimed:" $r.claimed_value
Write-Host "error%:" $r.percentage_error
```

---

### Test tier 2 — NLI (text claims without clear numbers)

```powershell
$r = Invoke-RestMethod -Uri http://localhost:5000/api/claims/verify `
  -Method POST -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"text":"The Indian government spent heavily on infrastructure in 2023"}'

Write-Host "tier_used:" $r.tier_used     # tier2 or tier3 depending on confidence
Write-Host "verdict:" $r.verdict
Write-Host "evidence count:" $r.evidence.Count
```

---

### Test tier 3 — LLM (complex/ambiguous claims)

```powershell
$r = Invoke-RestMethod -Uri http://localhost:5000/api/claims/deep `
  -Method POST -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"text":"India has the fastest growing economy among G20 nations in 2024"}'

Write-Host "tier_used:" $r.tier_used     # tier3
Write-Host "verdict:" $r.verdict
Write-Host "explanation:" $r.explanation
```

---

### Test bad claim (no extractable metric)

```powershell
try {
  Invoke-RestMethod -Uri http://localhost:5000/api/claims/verify `
    -Method POST -ContentType 'application/json' `
    -Headers @{ Authorization = "Bearer $TOKEN" } `
    -Body '{"text":"hi"}'
} catch {
  Write-Host "Status:" $_.Exception.Response.StatusCode.value__   # 400
}
```

---

## 5. Postman setup

If you prefer Postman over PowerShell:

1. Create a collection `B-ware`
2. Set a collection variable `baseUrl = http://localhost:5000`
3. Set a collection variable `token = ` (fill after login)
4. In the **Login** request → Tests tab, add:
   ```js
   pm.collectionVariables.set("token", pm.response.json().token);
   ```
5. For all protected requests, set Authorization → Bearer Token → `{{token}}`

**Import-ready requests:**

| Name | Method | URL | Body |
|---|---|---|---|
| Health | GET | `{{baseUrl}}/api/health` | — |
| Register | POST | `{{baseUrl}}/api/auth/register` | `{"name":"...","email":"...","password":"..."}` |
| Login | POST | `{{baseUrl}}/api/auth/login` | `{"email":"...","password":"..."}` |
| Logout | POST | `{{baseUrl}}/api/auth/logout` | — |
| Me | GET | `{{baseUrl}}/api/auth/me` | — |
| Verify | POST | `{{baseUrl}}/api/claims/verify` | `{"text":"India GDP was 8.2% in 2023"}` |
| Quick | POST | `{{baseUrl}}/api/claims/quick` | `{"text":"..."}` |
| Deep | POST | `{{baseUrl}}/api/claims/deep` | `{"text":"..."}` |
| My claims | GET | `{{baseUrl}}/api/claims` | — |
| Stats | GET | `{{baseUrl}}/api/claims/stats` | — |
| Claim by ID | GET | `{{baseUrl}}/api/claims/1` | — |
| Trending | GET | `{{baseUrl}}/api/trending` | — |
| Sources | GET | `{{baseUrl}}/api/trending/sources` | — |

---

## 6. Common errors

| Error | Cause | Fix |
|---|---|---|
| `ECONNREFUSED :5000` | Server not running | `npm run dev` |
| `MySQL failed` on startup | DB not running or wrong password in `.env` | Check `.env`, start MySQL |
| `Redis error: connect ECONNREFUSED` | Redis not running | `docker start redis` or start Redis service |
| `401 No token provided` | Forgot `Authorization: Bearer` header | Add the header |
| `401 Token has been revoked` | Used token after logout | Login again, get fresh token |
| Claim verify takes 40s first time | HF space was sleeping (cold start) | Normal — subsequent calls are fast |
| `422` from verify | NLP couldn't extract a metric from the text | Try a clearer numeric claim |
| `from_cache: true` in response | Claim was already verified in last 24h | Expected behaviour |
