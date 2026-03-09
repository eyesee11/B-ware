# B-Ware Backend — Testing Guide

Start the server first:

```
cd backend
npm run dev
```

---

# 1. Health Check

```
Invoke-RestMethod http://localhost:5000/api/health | ConvertTo-Json
```

Expected:

```
{
 "status": "healthy",
 "mysql": "ok",
 "redis": "ok"
}
```

---

# 2. Authentication

## Register

```
Invoke-RestMethod -Uri http://localhost:5000/api/auth/register `
 -Method POST `
 -ContentType "application/json" `
 -Body '{"name":"Deepanshu","email":"deep@test.com","password":"test1234"}'
```

---

## Login and Save Token

```
$r = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login `
 -Method POST `
 -ContentType "application/json" `
 -Body '{"email":"deep@test.com","password":"test1234"}'

$TOKEN = $r.token
$TOKEN
```

---

## Get Current User

```
Invoke-RestMethod http://localhost:5000/api/auth/me `
 -Headers @{ Authorization = "Bearer $TOKEN" }
```

---

## Logout

```
Invoke-RestMethod -Uri http://localhost:5000/api/auth/logout `
 -Method POST `
 -Headers @{ Authorization = "Bearer $TOKEN" }
```

---

# 3. Claims Verification

Login first and save `$TOKEN`.

## Verify Claim

```
Invoke-RestMethod -Uri http://localhost:5000/api/claims/verify `
 -Method POST `
 -ContentType "application/json" `
 -Headers @{ Authorization = "Bearer $TOKEN" } `
 -Body '{"text":"India GDP growth was 8.2 percent in 2023"}'
```

---

## Quick Verify (Tier-1)

```
Invoke-RestMethod -Uri http://localhost:5000/api/claims/quick `
 -Method POST `
 -ContentType "application/json" `
 -Headers @{ Authorization = "Bearer $TOKEN" } `
 -Body '{"text":"India inflation was 4 percent in 2022"}'
```

---

## Deep Verify (All Tiers)

```
Invoke-RestMethod -Uri http://localhost:5000/api/claims/deep `
 -Method POST `
 -ContentType "application/json" `
 -Headers @{ Authorization = "Bearer $TOKEN" } `
 -Body '{"text":"India unemployment rate was 7.8 percent in 2023"}'
```

---

# 4. Redis Cache Test

Run the same claim twice.

```
Invoke-RestMethod -Uri http://localhost:5000/api/claims/quick `
 -Method POST `
 -ContentType "application/json" `
 -Headers @{ Authorization = "Bearer $TOKEN" } `
 -Body '{"text":"India GDP growth was 8.2 percent in 2023"}'

$a = Invoke-RestMethod -Uri http://localhost:5000/api/claims/quick `
 -Method POST `
 -ContentType "application/json" `
 -Headers @{ Authorization = "Bearer $TOKEN" } `
 -Body '{"text":"India GDP growth was 8.2 percent in 2023"}'

$a.from_cache
```

Expected:

```
True
```

---

# 5. Claim History

```
Invoke-RestMethod http://localhost:5000/api/claims `
 -Headers @{ Authorization = "Bearer $TOKEN" }
```

---

## Claim History with Pagination

```
Invoke-RestMethod "http://localhost:5000/api/claims?page=1&limit=5" `
 -Headers @{ Authorization = "Bearer $TOKEN" }
```

---

## Get Single Claim

```
Invoke-RestMethod "http://localhost:5000/api/claims/1" `
 -Headers @{ Authorization = "Bearer $TOKEN" }
```

---

# 6. Claim Statistics

```
Invoke-RestMethod "http://localhost:5000/api/claims/stats" `
 -Headers @{ Authorization = "Bearer $TOKEN" }
```

---

# 7. Trending Endpoints

## All Trending Stories

```
Invoke-RestMethod http://localhost:5000/api/trending
```

---

## Filter by Verdict

```
Invoke-RestMethod "http://localhost:5000/api/trending?verdict=false"
```

---

## Source Leaderboard

```
Invoke-RestMethod http://localhost:5000/api/trending/sources
```

---

## Single Trending Story

```
Invoke-RestMethod http://localhost:5000/api/trending/1
```

---

# 8. NLP Service Test

## Check NLP Service

```
Invoke-RestMethod https://eyesee11-b-ware.hf.space/health
```

---

## Tier-1 Numeric Test

```
Invoke-RestMethod -Uri http://localhost:5000/api/claims/quick `
 -Method POST `
 -ContentType "application/json" `
 -Headers @{ Authorization = "Bearer $TOKEN" } `
 -Body '{"text":"India GDP growth rate was 6.1 percent in 2022"}'
```

---

## Tier-2 NLI Test

```
Invoke-RestMethod -Uri http://localhost:5000/api/claims/verify `
 -Method POST `
 -ContentType "application/json" `
 -Headers @{ Authorization = "Bearer $TOKEN" } `
 -Body '{"text":"The Indian government spent heavily on infrastructure in 2023"}'
```

---

## Tier-3 LLM Test

```
Invoke-RestMethod -Uri http://localhost:5000/api/claims/deep `
 -Method POST `
 -ContentType "application/json" `
 -Headers @{ Authorization = "Bearer $TOKEN" } `
 -Body '{"text":"India has the fastest growing economy among G20 nations in 2024"}'
```

---

# 9. Bad Claim Test

```
Invoke-RestMethod -Uri http://localhost:5000/api/claims/verify `
 -Method POST `
 -ContentType "application/json" `
 -Headers @{ Authorization = "Bearer $TOKEN" } `
 -Body '{"text":"hi"}'
```

Expected:

```
400 Bad Request
```

---

# 10. Common Errors

| Error              | Cause                        |
| ------------------ | ---------------------------- |
| ECONNREFUSED 5000  | Server not running           |
| MySQL failed       | Database not running         |
| Redis ECONNREFUSED | Redis not running            |
| 401 No token       | Missing Authorization header |
| Token revoked      | Used token after logout      |
| First verify slow  | NLP cold start               |
