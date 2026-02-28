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

9>