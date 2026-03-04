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
import asyncio
import logging
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from pydantic import BaseModel, Field

from claim_detector import split_into_sentences, score_claim_probability, detect_claim_language
from extractor import extract_all, preprocess_claim
from metrics import get_all_metric_names
from swagger_ui import get_swagger_html, tags_metadata
from verifier.tier1_numeric import tier1_numeric_check
from verifier.verdict_router import route_verification, VerificationResult

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)s  %(levelname)s  %(message)s",
)
logger = logging.getLogger("bware.nlp")
limiter = Limiter(key_func=get_remote_address)
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
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "India's GDP growth rate stood at 7.5 percent in 2024"
            }
        }
    }


class ExtractionResponse(BaseModel):
    """What we send BACK to the client."""
    original_text: str
    metric: str | None = None
    value: float | None = None
    year: int | None = None
    value_type: str | None = None   # N-20: "percentage" | "absolute"
    confidence: float

    model_config = {
        "json_schema_extra": {
            "example": {
                "original_text": "India's GDP growth rate stood at 7.5 percent in 2024",
                "metric": "GDP growth rate",
                "value": 7.5,
                "year": 2024,
                "value_type": "percentage",
                "confidence": 0.9
            }
        }
    }


class HealthResponse(BaseModel):
    """Health check response — includes component readiness."""
    status: str           # "healthy" | "degraded"
    service: str
    version: str
    bart_model: str       # "loaded" | "not_loaded"
    gemini_key: str       # "configured" | "missing"
    newsapi_key: str      # "configured" | "missing"
    factcheck_key: str    # "configured" | "missing"

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "service": "B-ware NLP Service",
                "version": "1.0.0",
                "bart_model": "loaded",
                "gemini_key": "configured",
                "newsapi_key": "missing",
                "factcheck_key": "configured"
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
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "claims": [
                    "India's GDP growth rate stood at 7.5 percent in 2024",
                    "Retail CPI inflation fell to 4.8% in January 2024",
                    "India's forex reserves crossed $650 billion in 2024"
                ]
            }
        }
    }


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
# N-5 — PARAGRAPH ANALYSIS RESPONSE MODELS
# =============================================================================

class SentenceAnalysis(BaseModel):
    """One sentence from the analyzed paragraph, with its claim probability and extraction."""
    sentence: str
    claim_probability: float
    extraction: ExtractionResponse

    model_config = {
        "json_schema_extra": {
            "example": {
                "sentence": "India's GDP growth rate was 7.5% in 2024",
                "claim_probability": 0.95,
                "extraction": {
                    "original_text": "India's GDP growth rate was 7.5% in 2024",
                    "metric": "GDP growth rate",
                    "value": 7.5,
                    "year": 2024,
                    "value_type": "percentage",
                    "confidence": 0.9
                }
            }
        }
    }


class ParagraphResponse(BaseModel):
    """
    Response for POST /analyze.

    Fields:
      total_sentences       — total sentences found in the paragraph
      verified_count        — sentences that scored > 0.5 claim probability
      high_confidence_count — verified claims with extraction confidence ≥ 0.8
      results               — per-claim sentence, probability and extraction data
    """
    total_sentences: int
    verified_count: int
    high_confidence_count: int
    results: list[SentenceAnalysis]

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_sentences": 3,
                "verified_count": 2,
                "high_confidence_count": 1,
                "results": [
                    {
                        "sentence": "India's GDP growth rate was 7.5% in 2024",
                        "claim_probability": 0.95,
                        "extraction": {
                            "original_text": "India's GDP growth rate was 7.5% in 2024",
                            "metric": "GDP growth rate",
                            "value": 7.5,
                            "year": 2024,
                            "value_type": "percentage",
                            "confidence": 0.9
                        }
                    }
                ]
            }
        }
    }


class NumericCheckResult(BaseModel):
    """
    The result of comparing a claimed value against official World Bank data.
    Returned as part of QuickVerificationResult.
    """
    official_value: float | None = None
    claimed_value: float | None = None
    percentage_error: float | None = None
    source: str | None = None
    indicator_code: str | None = None
    source_url: str | None = None
    year: int | None = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "official_value": 6.49,
                "claimed_value": 7.5,
                "percentage_error": 15.48,
                "source": "World Bank",
                "indicator_code": "NY.GDP.MKTP.KD.ZG",
                "source_url": "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=IN",
                "year": 2024
            }
        }
    }


class QuickVerificationResult(BaseModel):
    """
    Response shape for POST /verify/quick (Tier 1 only).

    verdict meanings:
      accurate      — % error < 5%
      misleading    — % error between 5% and 20%
      false         — % error >= 20%
      unverifiable  — could not extract metric/value/year OR
                      World Bank has no data for that metric/year
    """
    original_text: str
    tier_used: str = "tier1"
    verdict: str
    confidence: float
    extraction: ExtractionResponse
    numeric_check: NumericCheckResult | None = None
    explanation: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "original_text": "India's GDP growth rate was 7.5% in 2024",
                "tier_used": "tier1",
                "verdict": "misleading",
                "confidence": 0.78,
                "extraction": {
                    "original_text": "India's GDP growth rate was 7.5% in 2024",
                    "metric": "GDP growth rate",
                    "value": 7.5,
                    "year": 2024,
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
                "explanation": "Claimed 7.5%, official World Bank value is 6.49% (error: 15.48%). Classified as misleading."
            }
        }
    }


# =============================================================================
# FULL VERIFICATION RESPONSE MODELS (used by /verify and /verify/deep)
# =============================================================================

class VerificationEvidenceItem(BaseModel):
    """One piece of evidence shown in the full verification response."""
    source: str
    snippet: str
    url: str
    evidence_type: str
    nli_verdict: str | None = None
    nli_score: float | None = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "source": "Reuters",
                "snippet": "India's GDP growth accelerated to 6.5% in fiscal year 2024.",
                "url": "https://reuters.com/article/india-gdp",
                "evidence_type": "news",
                "nli_verdict": "entailment",
                "nli_score": 0.82
            }
        }
    }


class FullVerificationResult(BaseModel):
    """
    Response shape for POST /verify and POST /verify/deep.

    tier_used values:
      tier1  — verdict came from numeric World Bank check alone
      tier2  — verdict came from NLI over news/fact-check evidence
      tier3  — verdict came from Gemini LLM reasoning

    verdict values:
      accurate      — claim matches official/evidence data within 5%
      misleading    — claim is off by 5–20% or weakly contradicted
      false         — claim is off by >20% or strongly contradicted
      unverifiable  — insufficient data to decide
    """
    original_text: str
    tier_used: str
    verdict: str
    confidence: float

    # Extraction
    extracted_metric: str | None = None
    extracted_value: float | None = None
    extracted_year: int | None = None
    extraction_confidence: float

    # Numeric (Tier 1)
    official_value: float | None = None
    percentage_error: float | None = None
    official_source: str | None = None
    indicator_code: str | None = None
    source_url: str | None = None

    # Evidence + explanation
    evidence: list[VerificationEvidenceItem] = []
    explanation: str
    tiers_run: list[str] = []

    model_config = {
        "json_schema_extra": {
            "example": {
                "original_text": "India's GDP growth rate was 7.5% in 2024",
                "tier_used": "tier2",
                "verdict": "misleading",
                "confidence": 0.71,
                "extracted_metric": "GDP growth rate",
                "extracted_value": 7.5,
                "extracted_year": 2024,
                "extraction_confidence": 0.9,
                "official_value": 6.49,
                "percentage_error": 15.48,
                "official_source": "World Bank",
                "indicator_code": "NY.GDP.MKTP.KD.ZG",
                "source_url": "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=IN",
                "evidence": [],
                "explanation": "Numeric check: claimed GDP growth rate = 7.5 (2024), official World Bank = 6.4900 (error: 15.48%) → misleading.",
                "tiers_run": ["tier1", "tier2"]
            }
        }
    }


# =============================================================================
# VERDICT HELPER
# =============================================================================

def _compute_verdict(percentage_error: float | None) -> tuple[str, str]:
    """
    Apply the verdict rule based on % error.
    Returns (verdict, explanation_fragment).

    Rules (from project spec):
      < 5%  → accurate
      < 20% → misleading
      >= 20% → false
    """
    if percentage_error is None:
        return "unverifiable", "No official data found for this metric/year."
    if percentage_error < 5.0:
        return "accurate", f"Percentage error is {percentage_error:.2f}%, which is within the acceptable 5% threshold."
    if percentage_error < 20.0:
        return "misleading", f"Percentage error is {percentage_error:.2f}%, which exceeds 5% but is below 20% — classified as misleading."
    return "false", f"Percentage error is {percentage_error:.2f}%, which exceeds 20% — classified as false."



# THE FASTAPI APP

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

# ---------------------------------------------------------------------------
# CORS — allow React (:3000), Node backend (:5000), VS Code Live Server (:5500)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# RATE LIMITING (defense-in-depth; Node backend also rate-limits)
# ---------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    """Catch-all exception handler to prevent 500 errors from crashing the server."""
    return  JSONResponse(status_code=500, 
                        content={"error": "Internal server error", 
                        "detail": str(exc)})

# ENDPOINTS

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
    """
    Check if the NLP service is running and all components are ready.
    Returns component-level status so the Node backend can make informed decisions.

    - `bart_model: loaded`  — BART-MNLI is warm in memory (first /verify/deep call triggers load)
    - `*_key: configured`   — the env var is set (non-empty); does not validate the key
    - `status: degraded`    — at least one key is missing (Tier 2/3 may fail)
    """
    from verifier.tier2_nli import _load_pipeline  # local import to avoid circular

    bart_status = "loaded" if _load_pipeline.cache_info().currsize > 0 else "not_loaded"
    gemini_key  = "configured" if os.getenv("GEMINI_API_KEY")            else "missing"
    newsapi_key = "configured" if os.getenv("NEWS_API_KEY")              else "missing"
    factcheck   = "configured" if os.getenv("GOOGLE_FACT_CHECK_API_KEY") else "missing"

    # Degrade if any external API key is missing (Tier 2/3 will silently skip them)
    keys_ok = all(k == "configured" for k in [gemini_key, newsapi_key, factcheck])
    overall = "healthy" if keys_ok else "degraded"

    return {
        "status": overall,
        "service": "B-ware NLP Service",
        "version": "1.0.0",
        "bart_model": bart_status,
        "gemini_key": gemini_key,
        "newsapi_key": newsapi_key,
        "factcheck_key": factcheck,
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
    # N-24: Reject non-English input with a clear error
    lang = detect_claim_language(request.text)
    if lang != "en":
        raise HTTPException(
            status_code=422,
            detail=f"Only English claims are supported. Detected language: '{lang}'.",
        )
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
    response_model=ParagraphResponse,
    tags=["Paragraph Analysis"],
    summary="Analyze a full paragraph for verifiable claims",
    response_description="Sentence stats and per-claim extractions for the full paragraph"
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
    # N-24: Reject non-English paragraphs before any processing
    lang = detect_claim_language(request.text)
    if lang != "en":
        raise HTTPException(
            status_code=422,
            detail=f"Only English claims are supported. Detected language: '{lang}'.",
        )

    sentences = split_into_sentences(request.text)
    sentence_results: list[SentenceAnalysis] = []

    for sentence in sentences:
        prob = score_claim_probability(sentence)
        if prob > 0.5:
            extraction = extract_all(sentence)
            sentence_results.append(
                SentenceAnalysis(
                    sentence=sentence,
                    claim_probability=round(prob, 2),
                    extraction=ExtractionResponse(**extraction),
                )
            )

    return ParagraphResponse(
        total_sentences=len(sentences),
        verified_count=len(sentence_results),
        high_confidence_count=sum(
            1 for r in sentence_results if r.extraction.confidence >= 0.8
        ),
        results=sentence_results,
    )


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

# =============================================================================
# VERIFICATION ENDPOINTS (RAV Engine — Tier 1)
# =============================================================================

@app.post(
    "/verify/quick",
    response_model=QuickVerificationResult,
    tags=["Verification"],
    summary="Quick numeric verification (Tier 1 only)",
    response_description="Verdict based on official World Bank data comparison"
)
async def verify_quick(request: ClaimRequest):
    """
    **Fastest verification path.** Uses Tier 1 only: extracts metric/value/year
    from the claim and compares against official World Bank data.

    Best for: **numeric economic claims** with a clear year.
    e.g. *"India's GDP growth rate was 7.5% in 2024"*

    **How it works:**
    1. Extract `metric`, `value`, `year` via the regex extraction pipeline.
    2. Map the metric to a World Bank indicator code.
    3. Fetch the official value for that indicator + year from World Bank API.
    4. Compute `% error = |claimed − official| / |official| × 100`.
    5. Apply verdict rule:
       - `< 5%` → **accurate**
       - `5% – 20%` → **misleading**
       - `>= 20%` → **false**
       - No official data found → **unverifiable**

    **Limitations of /verify/quick:**
    - Only works for numeric claims with a recognisable metric + year.
    - Uses World Bank data only (quarterly/annual, may lag by 1–2 years).
    - For qualitative claims or deeper analysis, use `POST /verify` (coming soon).
    """
    # Step 1: Extract structured fields from the raw text
    extraction = extract_all(request.text)

    # Step 2: Run Tier 1 numeric check (async World Bank API call)
    t1 = await tier1_numeric_check(
        metric=extraction["metric"],
        claimed_value=extraction["value"],
        year=extraction["year"],
        country=extraction.get("country", "IND") or "IND",   # N-19
    )

    # Step 3: If extraction failed entirely, return unverifiable immediately
    if extraction["metric"] is None or extraction["value"] is None or extraction["year"] is None:
        missing = [f for f, v in [("metric", extraction["metric"]), ("value", extraction["value"]), ("year", extraction["year"])] if v is None]
        return QuickVerificationResult(
            original_text=request.text,
            tier_used="tier1",
            verdict="unverifiable",
            confidence=0.0,
            extraction=ExtractionResponse(**extraction),
            numeric_check=None,
            explanation=f"Could not extract the following fields: {', '.join(missing)}. "
                        f"This endpoint requires a numeric claim with a recognisable metric and year."
        )

    # Step 4: Build NumericCheckResult from tier1 dataclass
    numeric_check = NumericCheckResult(
        official_value=t1.official_value,
        claimed_value=t1.claimed_value,
        percentage_error=t1.percentage_error,
        source=t1.source,
        indicator_code=t1.indicator_code,
        source_url=t1.source_url,
        year=t1.year,
    )

    # Step 5: Compute verdict
    verdict, explanation_fragment = _compute_verdict(t1.percentage_error)

    # Step 6: Build explanation string
    if t1.official_value is not None:
        explanation = (
            f"Claimed {t1.claimed_value} for '{extraction['metric']}' in {t1.year}. "
            f"Official World Bank value: {t1.official_value:.4f}. "
            f"{explanation_fragment} "
            f"Source: {t1.source_url}"
        )
    else:
        explanation = (
            f"Found metric '{extraction['metric']}', value {t1.claimed_value}, year {t1.year}, "
            f"but World Bank has no data for this indicator/year combination. "
            f"Try a different year or use /verify for deeper analysis."
        )

    # Step 7: Final confidence
    # Combine extraction confidence with tier1 result quality:
    # If we have an official value, confidence comes from extraction + low % error.
    # If no official value, confidence is just the extraction confidence halved.
    if t1.official_value is not None:
        tier1_quality = max(0.0, 1.0 - (t1.percentage_error / 100.0))
        final_confidence = round(extraction["confidence"] * tier1_quality, 2)
    else:
        final_confidence = round(extraction["confidence"] * 0.5, 2)

    return QuickVerificationResult(
        original_text=request.text,
        tier_used="tier1",
        verdict=verdict,
        confidence=final_confidence,
        extraction=ExtractionResponse(**extraction),
        numeric_check=numeric_check,
        explanation=explanation,
    )


# =============================================================================
# FULL VERIFICATION ENDPOINTS (RAV Engine — Tier 1 + 2 + 3)
# =============================================================================

@app.post(
    "/verify",
    response_model=FullVerificationResult,
    tags=["Verification"],
    summary="Full multi-tier verification",
    response_description="Best available verdict from Tier 1 → 2 → 3 pipeline"
)
async def verify_full(request: ClaimRequest):
    """
    **Full RAV pipeline.** Runs as many tiers as needed to produce a confident verdict.

    Routing logic:
    1. **Tier 1 (always)** — numeric World Bank check.
       If clear result (error < 5% or ≥ 20%) with high extraction confidence → return immediately.
    2. **Tier 2** — fetch news + fact-check evidence, run NLI model over snippets.
       If NLI confidence ≥ 0.6 → return merged Tier 1 + Tier 2 verdict.
    3. **Tier 3** — Gemini 1.5 Flash LLM reasoning over all collected context.
       Always used as fallback if Tier 2 is uncertain or model unavailable.

    Returns the `tier_used` field so you know which layer produced the verdict.
    Use `POST /verify/deep` to force all three tiers regardless of early exit conditions.
    """
    clean_text = preprocess_claim(request.text)
    try:
        result: VerificationResult = await asyncio.wait_for(
            route_verification(clean_text, force_tier3=False),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        logger.warning("verify_full timed out for text: %.80s", clean_text)
        return FullVerificationResult(
            original_text=clean_text,
            tier_used="tier1",
            verdict="unverifiable",
            confidence=0.0,
            extracted_metric=None,
            extracted_value=None,
            extracted_year=None,
            extraction_confidence=0.0,
            evidence=[],
            explanation="Verification timed out after 30 seconds.",
            tiers_run=[],
        )
    return FullVerificationResult(
        original_text=result.original_text,
        tier_used=result.tier_used,
        verdict=result.verdict,
        confidence=result.confidence,
        extracted_metric=result.extracted_metric,
        extracted_value=result.extracted_value,
        extracted_year=result.extracted_year,
        extraction_confidence=result.extraction_confidence,
        official_value=result.official_value,
        percentage_error=result.percentage_error,
        official_source=result.official_source,
        indicator_code=result.indicator_code,
        source_url=result.source_url,
        evidence=[
            VerificationEvidenceItem(
                source=e.source,
                snippet=e.snippet,
                url=e.url,
                evidence_type=e.evidence_type,
                nli_verdict=e.nli_verdict,
                nli_score=e.nli_score,
            )
            for e in result.evidence
        ],
        explanation=result.explanation,
        tiers_run=result.tiers_run,
    )


@app.post(
    "/verify/deep",
    response_model=FullVerificationResult,
    tags=["Verification"],
    summary="Deep verification — forces all three tiers",
    response_description="Verdict from all three tiers: numeric + evidence + LLM reasoning"
)
@limiter.limit("10/minute")
async def verify_deep(request: Request, body: ClaimRequest):
    """
    **Deepest verification path.** Forces the pipeline through all three tiers
    regardless of how confident earlier tiers are.

    Use this when:
    - You need maximum confidence combined from all data sources
    - The claim is important enough to warrant LLM reasoning even if Tier 1/2 gave a clear answer
    - You want `tiers_run: ["tier1", "tier2", "tier3"]` guaranteed in the response

    **Slower** than `/verify` — expect ~3–8 seconds latency (network + LLM).
    Subject to Gemini free-tier rate limits (15 req/min). **Rate limited to 10 req/min per IP.**
    """
    clean_text = preprocess_claim(body.text)
    try:
        result: VerificationResult = await asyncio.wait_for(
            route_verification(clean_text, force_tier3=True),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        logger.warning("verify_deep timed out for text: %.80s", clean_text)
        return FullVerificationResult(
            original_text=clean_text,
            tier_used="tier1",
            verdict="unverifiable",
            confidence=0.0,
            extracted_metric=None,
            extracted_value=None,
            extracted_year=None,
            extraction_confidence=0.0,
            evidence=[],
            explanation="Verification timed out after 30 seconds.",
            tiers_run=[],
        )
    return FullVerificationResult(
        original_text=result.original_text,
        tier_used=result.tier_used,
        verdict=result.verdict,
        confidence=result.confidence,
        extracted_metric=result.extracted_metric,
        extracted_value=result.extracted_value,
        extracted_year=result.extracted_year,
        extraction_confidence=result.extraction_confidence,
        official_value=result.official_value,
        percentage_error=result.percentage_error,
        official_source=result.official_source,
        indicator_code=result.indicator_code,
        source_url=result.source_url,
        evidence=[
            VerificationEvidenceItem(
                source=e.source,
                snippet=e.snippet,
                url=e.url,
                evidence_type=e.evidence_type,
                nli_verdict=e.nli_verdict,
                nli_score=e.nli_score,
            )
            for e in result.evidence
        ],
        explanation=result.explanation,
        tiers_run=result.tiers_run,
    )


# Run the server directly: python main.py
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting B-ware NLP Service...")
    logger.info("API docs available at: http://localhost:5001/docs")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5001,
        reload=True
    )
