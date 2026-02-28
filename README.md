# B-ware : No Lies Told

## An AI-Powered Facts and Claims checker ML model which verifies the possibility and error percentage of the claim being made by the user.

### Step 1 - Basic Structure Outline

```
project
│   README.md   
└───backend/
    ├── package.json          
    ├── node_modules/         
    ├── .env                  
    ├── .gitignore            
    ├── server.js             
    ├── config/
    │   └── db.js             ← database connection setup
    ├── routes/
    │   └── (empty for now)   ← API route files will go here
    ├── controllers/
    │   └── (empty for now)   ← business logic will go here
    └── middleware/
        └── (empty for now)   ← auth checks, error handlers will go here
|
|
└───frontend
    │   (to be filled)
└───database
    │   schema.sql
└───nlp-service
    │   soon
```
   

### Step 2 - Database Designing

1> We created the base model structure of the MVP product, and decided the main tables to be used.
2> Those being USERS, CLAIMS, Official_data_cache, Verification_log.
3> Tried caching some of the basic calculation part to make the retrieval faster.

### Step 3 - NLP Service

1> NLP service is a separate microservice — a small, independent app that does only one job: take a raw claim like "India's GDP growth rate was 7.5% in 2024" and extract three things:
```
Field	Example	            Goes into
metric	"GDP growth rate"	claims.extracted_metric
value	7.50	            claims.extracted_value
year	2024	            claims.extracted_year 
```
2> The NLP layer handles the text analysis. The nodejs backed will send a HTTP POST request to the NLP service though an API we will build.

3> 
```
User → Frontend → Backend (Node.js :5000) → NLP Service (Python :5001) → Response flows back
```

4> Service Structure:
```
nlp-service/
├── requirements.txt        ← Python dependencies
├── main.py                 ← FastAPI app + endpoint
├── extractor.py            ← Core regex extraction logic
├── metrics.py              ← Dictionary of known metrics (for normalization)
└── tests/
    └── test_extractor.py   ← Test cases to verify extraction works
```

5> main.py says "when someone POSTs to /extract, call this function" (like routes)
```
One POST endpoint: POST /extract — accepts { "text": "India's GDP..." }, returns { "metric": "...", "value": ..., "year": ..., "confidence": ... }.
```
6> extractor.py does the actual work (like controllers)
7> metrics.py is a knowledge base — a dictionary of metrics we recognize
```
Metrics to be included for validation (for MVP) :
GDP growth rate — Most cited economic metric
Inflation rate — CPI-based inflation
Unemployment rate — Jobless rate
Fiscal deficit — Government spending vs revenue gap
Literacy rate — Education metric
Population — Demographic claims
Per capita income — Income metrics
Poverty rate — Below poverty line percentage
Foreign exchange reserves / Forex reserves
Trade deficit / Current account deficit
```
8> A test Folder with a test_extractor file to test the rgression caused by slight chang ein the Regex pattern we are trying to verify.

```
"GDP growth rate was 7.5% in 2024" — standard
"inflation hit 6.2% this year" — no explicit year (needs handling)
"Unemployment was at 4.1 percent in 2023" — "percent" spelled out
"India spent ₹50 lakh crore on defense in 2025" — Indian currency format
```

9> Sources/Citations used for Claims verification:
```
#	Source	What Data	API / URL	Format
1	World Bank Open Data	GDP, inflation, unemployment, poverty, literacy — for ALL countries	https://api.worldbank.org/v2/country/IND/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2020:2025	REST JSON
2	RBI (Reserve Bank of India)	Forex reserves, CPI inflation, monetary data	https://data.rbi.org.in/ (DBIE portal)	CSV/Excel download
3	data.gov.in	India-specific: literacy, population, fiscal data	https://data.gov.in/search (API key required — free)	REST JSON
4	IMF Data API	GDP, fiscal deficit, trade deficit, current account	https://www.imf.org/external/datamapper/api/v1/	REST JSON
5	FRED (Federal Reserve)	Global economic indicators (backup source)	https://api.stlouisfed.org/fred/series/observations?series_id=...&api_key=YOUR_KEY	REST JSON

```

10> Main World bank Indicator Codes:
```
Your Metric	World Bank Indicator Code	API URL
GDP growth rate	NY.GDP.MKTP.KD.ZG	/country/IND/indicator/NY.GDP.MKTP.KD.ZG
Inflation rate	FP.CPI.TOTL.ZG	/country/IND/indicator/FP.CPI.TOTL.ZG
Unemployment rate	SL.UEM.TOTL.ZS	/country/IND/indicator/SL.UEM.TOTL.ZS
Fiscal deficit	GC.BAL.CASH.GD.ZS	/country/IND/indicator/GC.BAL.CASH.GD.ZS
Literacy rate	SE.ADT.LITR.ZS	/country/IND/indicator/SE.ADT.LITR.ZS
Population	SP.POP.TOTL	/country/IND/indicator/SP.POP.TOTL
Per capita income	NY.GDP.PCAP.CD	/country/IND/indicator/NY.GDP.PCAP.CD
Poverty rate	SI.POV.NAHC	/country/IND/indicator/SI.POV.NAHC
Foreign exchange reserves	FI.RES.TOTL.CD	/country/IND/indicator/FI.RES.TOTL.CD
Current account deficit	BN.CAB.XOKA.GD.ZS	/country/IND/indicator/BN.CAB.XOKA.GD.ZS
```

11> Data Flow Architecture:
```
                    ┌────────────────────┐
  On Startup /      │  World Bank API    │
  Scheduled Job ──→ │  data.gov.in API   │ ──→ Fetch latest data       |                    |
                    │  RBI/IMF           │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ official_data_cache│  INSERT/UPDATE
                    │ metric_name, year, │  actual values
                    │ value, source      │
                    └────────┬───────────┘
                             │
      User submits claim     │
            │                │
            ▼                ▼
    ┌──────────────┐  ┌──────────────────┐
    │ NLP Service  │  │ Comparison Logic |
    │ extracts:    │──│ official - claim |
    │ metric, value│  │ = difference     |
    │ year         │  │ = % error        |
    └──────────────┘  │ = verdict        │
                      └──────────────────┘
```

12> Full Integration Architecture (AIM) :
```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                              │
│  Frontend (React/Next.js) — localhost:3000                           │
│                                                                      │
│  1. User types: "India's GDP growth was 7.5% in 2024"               │
│  2. Clicks "Verify" → POST /api/claims to backend                   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTP
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Backend (Node.js/Express) — localhost:5000                          │
│                                                                      │
│  3. Auth middleware: verify JWT token                                 │
│  4. POST /api/claims handler:                                        │
│     a. Save claim to DB (status: 'pending')                          │
│     b. Call NLP service → POST http://localhost:5001/extract          │
│     c. Receive {metric, value, year} from NLP                        │
│     d. UPDATE claims SET extracted_metric, extracted_value, year      │
│     e. Query official_data_cache for (metric, year)                  │
│     f. Calculate difference, percentage_error, verdict               │
│     g. INSERT into verification_log                                  │
│     h. UPDATE claims SET credibility_score, status='verified'        │
│     i. Return full result to frontend                                │
└───────────────┬──────────────────────────────────────────────────────┘
                │ HTTP                        │ SQL
                ▼                             ▼
┌───────────────────────┐     ┌──────────────────────────────┐
│ NLP Service (Python)  │     │ MySQL Database               │
│ FastAPI — port 5001   │     │ localhost:3306               │
│                       │     │                              │
│ POST /extract         │     │ Tables:                      │
│ → Returns metric,     │     │   users                      │
│   value, year,        │     │   claims                     │
│   confidence          │     │   official_data_cache        │
│                       │     │   verification_log           │
└───────────────────────┘     └──────────────────────────────┘
```

13> Two-Tier System:
```
User claim → Regex (fast, cheap) → Cache hit? 
                                     │
                          ┌──────────┴──────────┐
                          │ YES                  │ NO
                          ▼                      ▼
                   Return cached result    ML Model (slower, smarter)
                                          Train on datasets
                                          Return prediction
                                          Cache the result for next time
```

ML model becomes primary extractor
Regex becomes the fast cache (your original idea)
If regex confidence ≥ 0.9 → skip ML, return immediately
If regex confidence < 0.9 → call ML model for better extraction