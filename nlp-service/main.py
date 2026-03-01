"""
main.py — The FastAPI Application

Entry point of the NLP service. Exposes the extraction logic as HTTP API endpoints.
The Node.js backend will POST claims here, and we return extracted metric/value/year.

To run:
    uvicorn main:app --reload --port 5001

    Breakdown:
      uvicorn       → the ASGI server (like nodemon for Python)
      main:app      → "in the file main.py, find the variable called app"
      --reload      → auto-restart on file changes (like nodemon)
      --port 5001   → listen on port 5001 (backend is on 5000)

Swagger docs: http://localhost:5001/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from extractor import extract_all
from metrics import get_all_metric_names
from claim_detector import split_into_sentences, score_claim_probability
from swagger_ui import get_swagger_html, tags_metadata
# =============================================================================
# PYDANTIC MODELS — Request/Response contracts
# =============================================================================

class ClaimRequest(BaseModel):
    """What the client sends TO us."""
    text: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="The raw claim text to analyze. Can be a single sentence or a full paragraph.",
        example="India's GDP growth rate stood at 7.5 percent in 2024"
    )


class ExtractionResponse(BaseModel):
    """What we send BACK to the client."""
    original_text: str
    metric: str | None = None
    value: float | None = None
    year: int | None = None
    confidence: float

    model_config = {
        "json_schema_extra": {
            "example": {
                "original_text": "India's GDP growth rate stood at 7.5 percent in 2024",
                "metric": "GDP growth rate",
                "value": 7.5,
                "year": 2024,
                "confidence": 0.9
            }
        }
    }


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    version: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "service": "B-ware NLP Service",
                "version": "1.0.0"
            }
        }
    }


class MetricsListResponse(BaseModel):
    """List of supported metrics."""
    supported_metrics: list[str]
    count: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "supported_metrics": [
                    "GDP growth rate", "inflation rate", "unemployment rate",
                    "fiscal deficit", "literacy rate", "population",
                    "per capita income", "poverty rate",
                    "foreign exchange reserves", "current account deficit"
                ],
                "count": 10
            }
        }
    }


class BatchRequest(BaseModel):
    """What the client sends for a batch extraction."""
    claims: list[str] = Field(
        ...,
        min_length=1,
        max_length=50,
        description="List of individual claim texts to analyze. Maximum 50 claims per request.",
        example=[
            "India's GDP growth rate stood at 7.5 percent in 2024",
            "Retail CPI inflation fell to 4.8% in January 2024",
            "India's forex reserves crossed $650 billion in 2024"
        ]
    )


class BatchResponse(BaseModel):
    """What we send back for a batch extraction."""
    results: list[ExtractionResponse]
    total: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "results": [
                    {"original_text": "India's GDP growth rate stood at 7.5 percent in 2024", "metric": "GDP growth rate", "value": 7.5, "year": 2024, "confidence": 0.9},
                    {"original_text": "Retail CPI inflation fell to 4.8% in January 2024", "metric": "inflation rate", "value": 4.8, "year": 2024, "confidence": 0.9}
                ],
                "total": 2
            }
        }
    }


# =============================================================================
# CREATE THE FASTAPI APP
# =============================================================================

app = FastAPI(
    title="B-ware NLP Service",
    version="1.0.0",
    description="""
## B-ware Claim Extraction & Analysis API

This service is the **NLP backbone of the B-ware fact-checking platform**.
It takes raw text — a single sentence or a full paragraph — and extracts
structured, verifiable information from it.

---

### What This Service Does

| Extracts | Example input | Example output |
|---|---|---|
| **Metric** | "GDP growth rate stood at..." | `GDP growth rate` |
| **Value** | "...stood at 7.5 percent..." | `7.5` |
| **Year** | "...in 2024" | `2024` |
| **Confidence** | all three found, strong match | `0.9` |

---

### Supported Economic Metrics (10)

`GDP growth rate` · `inflation rate` · `unemployment rate` · `fiscal deficit` ·
`literacy rate` · `population` · `per capita income` · `poverty rate` ·
`foreign exchange reserves` · `current account deficit`

---

### Confidence Score Guide

| Score | Meaning |
|---|---|
| `0.9` | Strong metric match + value + year all found |
| `0.6 – 0.8` | Weak metric match OR one field missing |
| `0.3 – 0.5` | Only partial extraction possible |
| `0.0` | Nothing could be extracted |

---

### Quick Start

```bash
# Single claim
curl -X POST http://localhost:5001/extract \\
  -H "Content-Type: application/json" \\
  -d '{"text": "India GDP growth rate was 7.5% in 2024"}'

# Full paragraph
curl -X POST http://localhost:5001/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"text": "India has been growing. GDP hit 7.5% in 2024. Inflation fell to 4.8%."}'
```
    """,
    contact={
        "name": "B-ware Development",
        "url": "https://github.com/B-ware",
    },
    license_info={
        "name": "MIT",
    },
    openapi_tags=tags_metadata,
    docs_url=None,   # we override /docs below with custom settings
)



# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    """Serve Swagger UI with a custom dark theme."""
    return HTMLResponse(get_swagger_html())




@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Service Info"],
    summary="Health check",
    response_description="Service status and version info"
)
def health_check():
    """Check if the NLP service is running and responsive."""
    return {
        "status": "healthy",
        "service": "B-ware NLP Service",
        "version": "1.0.0"
    }


@app.post(
    "/extract",
    response_model=ExtractionResponse,
    tags=["Core Extraction"],
    summary="Extract from a single claim",
    response_description="Extracted metric, value, year and confidence score"
)
def extract_claim(request: ClaimRequest):
    """
    Extract the economic metric, numeric value, and year from a **single claim sentence**.

    The extraction pipeline runs three steps in sequence:
    1. **Metric detection** — matches against 10 supported economic indicators using
       two-tier regex (strong patterns → 0.9 confidence, weak patterns → 0.6 confidence)
    2. **Value extraction** — finds the numeric value, prioritising percentages over
       plain numbers. Handles Indian formats (1,72,000) and negative values.
    3. **Year extraction** — finds the most recent 4-digit year mentioned (1900–2099)

    The **confidence score** reflects how complete and certain the extraction was:
    - `0.9` — strong metric match, all three fields found
    - `0.6` — weak metric match or one field missing
    - `0.0` — metric not recognised
    """
    result = extract_all(request.text)
    return result

@app.post(
    "/batch",
    response_model=BatchResponse,
    tags=["Core Extraction"],
    summary="Extract from multiple claims at once",
    response_description="List of extraction results, one per input claim"
)
def batch_extract(request: BatchRequest):
    """
    Run the extraction pipeline on a **list of up to 50 claims** in a single request.

    Each claim is processed independently using the same pipeline as `/extract`.
    If one claim fails (e.g. malformed input), it returns a zeroed-out result
    for that item rather than failing the entire batch.

    **Use this endpoint when:**
    - You have a pre-split list of claim sentences
    - You want to process a CSV or database of claims in bulk
    - The claims are already individual sentences (not raw paragraphs)

    For raw paragraphs, use `/analyze` instead — it handles sentence splitting automatically.
    """
    results = []

    for claim_text in request.claims:        # loop over the list
        try:
            result = extract_all(claim_text)     # same function /extract uses
            results.append(result)
        except Exception as e:
            # If one claim fails, don't crash the whole batch.
            # Return a zeroed-out result for that claim instead.
            results.append({
                "original_text": claim_text,
                "metric": None,
                "value": None,
                "year": None,
                "confidence": 0.0
            })

    return {
        "results": results,
        "total": len(results)
    }

@app.post(
    "/analyze",
    response_model=list[ExtractionResponse],
    tags=["Paragraph Analysis"],
    summary="Analyze a full paragraph for verifiable claims",
    response_description="Extraction results for all sentences identified as verifiable claims"
)
def analyze_text(request: ClaimRequest):
    """
    Feed a **full paragraph** and get back extraction results for every sentence
    that looks like a verifiable economic claim.

    This endpoint does two things automatically:

    **Step 1 — Sentence splitting**
    The paragraph is split into individual sentences using punctuation-aware splitting
    that protects abbreviations (`Rs.`, `Dr.`, `No.`) from causing false splits.

    **Step 2 — Claim probability scoring**
    Each sentence is scored on a `0.0 → 1.0` scale based on heuristic signals:

    | Signal | Points |
    |---|---|
    | Has a number or percentage | +0.30 |
    | Mentions a year (1900–2099) | +0.20 |
    | Contains a known metric keyword | +0.25 |
    | Uses an assertion verb (grew, fell, stood at...) | +0.15 |
    | Names a subject (India, RBI, government...) | +0.05 |
    | Ideal sentence length (8–50 words) | +0.05 |

    Only sentences scoring **above 0.5** are passed to the extractor.
    Commentary, questions, and context sentences are automatically filtered out.
    """
    sentences = split_into_sentences(request.text)
    results = []

    for sentence in sentences:
        prob = score_claim_probability(sentence)
        if prob > 0.5:
            result = extract_all(sentence)
            results.append(result)

    return results


@app.get(
    "/metrics",
    response_model=MetricsListResponse,
    tags=["Service Info"],
    summary="List all supported economic metrics",
    response_description="Complete list of recognisable metrics and total count"
)
def list_metrics():
    """
    Returns the **complete list of economic metrics** this service can recognise and extract.

    These metric names are the exact strings returned in the `metric` field of
    `ExtractionResponse`. Use this list to:
    - Validate metric names before querying `official_data_cache` in your backend
    - Build dropdown filters in your frontend
    - Know when a claim falls outside the supported scope

    The 10 supported metrics map directly to **World Bank and IMF indicator codes**
    for data verification.
    """
    names = get_all_metric_names()
    return {
        "supported_metrics": names,
        "count": len(names)
    }

# Run the server directly: python main.py
if __name__ == "__main__":
    import uvicorn
    print("Starting B-ware NLP Service...")
    print("API docs available at: http://localhost:5001/docs")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5001,
        reload=True
    )
