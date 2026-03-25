# =============================================================================
# B-ware NLP Service — Dockerfile
# =============================================================================
# Build: docker build -t bware-nlp .
# Run:   docker run -p 5001:5001 --env-file .env bware-nlp
#
# Image size: ~5-6 GB (PyTorch + BART model cached inside the image)
# Use --extra-index-url for CPU-only torch to reduce to ~3 GB (see note below).
# =============================================================================

FROM python:3.10-slim

# --- System dependencies -------------------------------------------------
# gcc needed to compile some Python packages (e.g. tokenizers wheels)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Python dependencies ------------------------------------------------
# Copy requirements first so Docker caches the layer unless requirements change
COPY requirements.txt .

# Install CPU-only torch first (saves ~1.5 GB vs the default CUDA build),
# then install the rest of requirements normally.
RUN pip install --no-cache-dir torch --extra-index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# --- Application code ---------------------------------------------------
COPY . .

# --- Pre-download the BART model ----------------------------------------
# Running this at build time means the first HTTP request is instant.
# Without this, the first /verify/deep call downloads ~1.6 GB at runtime.
RUN python -c "\
from transformers import pipeline; \
print('Downloading facebook/bart-large-mnli...'); \
pipeline('zero-shot-classification', model='facebook/bart-large-mnli'); \
print('Model cached successfully.')"

# --- Runtime configuration ----------------------------------------------
# HuggingFace Spaces routes all traffic to port 7860.
# Locally you can override: docker run -e PORT=5001 ...
ENV PORT=7860
EXPOSE 7860

# Health check — Docker marks container unhealthy if /health stops responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:${PORT}/health').raise_for_status()" \
    || exit 1

# Start the service — reads PORT env var so it works on HF Spaces and locally
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
