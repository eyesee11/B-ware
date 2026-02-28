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
from pydantic import BaseModel, Field
from extractor import extract_all
from metrics import get_all_metric_names

# Pydantic Models — Request/Response contracts

class ClaimRequest(BaseModel):
    """What the client sends TO us."""
    text: str = Field(
        ...,                    # "..." means REQUIRED (no default value)
        min_length=3,
        max_length=2000,
        description="The raw claim text to analyze"
    )


class ExtractionResponse(BaseModel):
    """What we send BACK to the client."""
    original_text: str
    metric: str | None = None
    value: float | None = None
    year: int | None = None
    confidence: float


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    version: str


class MetricsListResponse(BaseModel):
    """List of supported metrics."""
    supported_metrics: list[str]
    count: int


# Create the FastAPI app

app = FastAPI(
    title="FACTZcheck NLP Service",
    description="Extracts economic metrics, values, and years from claim text",
    version="1.0.0"
)


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Check if the NLP service is running."""
    return {
        "status": "healthy",
        "service": "FACTZcheck NLP Service",
        "version": "1.0.0"
    }


@app.post("/extract", response_model=ExtractionResponse)
def extract_claim(request: ClaimRequest):
    """
    Extract metric, value, and year from a claim.
    
    Example request body:
        {"text": "India's GDP growth rate was 7.5% in 2024"}
    
    Example response:
        {"metric": "GDP growth rate", "value": 7.5, "year": 2024, "confidence": 0.9}
    """
    result = extract_all(request.text)
    return result


@app.get("/metrics", response_model=MetricsListResponse)
def list_metrics():
    """List all economic metrics this service can recognize."""
    names = get_all_metric_names()
    return {
        "supported_metrics": names,
        "count": len(names)
    }


# =============================================================================
# Run the server directly: python main.py
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    print("Starting FACTZcheck NLP Service...")
    print("API docs available at: http://localhost:5001/docs")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5001,
        reload=True
    )
