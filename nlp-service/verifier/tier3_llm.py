"""
tier3_llm.py — Tier 3: LLM reasoning over claim + evidence

This is the deepest and most capable tier of the RAV engine.
It is triggered when:
  - Tier 2 confidence < 0.6, OR
  - User calls POST /verify/deep explicitly

What it does:
  - Accepts the original claim + Tier 1 numeric result + top evidence snippets
  - Builds a structured prompt and sends it to Gemini 1.5 Flash API
  - Parses the JSON response into a Tier3Result
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field

import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini 1.5 Flash — free tier, fast, good reasoning
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent"
)

# Minimum verdict set the prompt enforces
VALID_VERDICTS = {"accurate", "misleading", "false", "unverifiable"}


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class EvidenceSummary:
    """Condensed evidence to feed into the LLM prompt."""
    source: str
    snippet: str
    url: str
    evidence_type: str   # "fact_check" | "news"


@dataclass
class Tier3Result:
    verdict: str            # "accurate" | "misleading" | "false" | "unverifiable"
    confidence: float       # 0.0 → 1.0 — model's self-reported confidence
    explanation: str        # Human-readable explanation from the LLM
    sources_used: list[str] = field(default_factory=list)
    raw_response: str = ""  # Full model response text, useful for debugging


# =============================================================================
# PROMPT BUILDER
# =============================================================================

def _build_prompt(
    claim: str,
    metric: str | None,
    claimed_value: float | None,
    year: int | None,
    official_value: float | None,
    percentage_error: float | None,
    official_source: str | None,
    evidence_snippets: list[EvidenceSummary],
) -> str:
    """
    Build the structured prompt we send to Gemini.

    Design principles:
    - Give the model all context we have (Tier 1 numeric result + evidence)
    - Constrain output to strict JSON so we can parse it reliably
    - No ambiguous instructions — every field is defined with allowed values
    - Instruct the model NOT to hallucinate sources or percentages
    """

    # ---- Numeric section ----
    if official_value is not None and percentage_error is not None:
        numeric_context = (
            f"  - Claimed {metric}: {claimed_value} (year: {year})\n"
            f"  - Official value ({official_source}): {official_value}\n"
            f"  - Percentage error: {percentage_error:.2f}%"
        )
    elif metric and claimed_value is not None:
        numeric_context = (
            f"  - Claimed {metric}: {claimed_value} (year: {year})\n"
            f"  - No official numeric data available for this metric/year."
        )
    else:
        numeric_context = "  - No numeric data could be extracted from the claim."

    # ---- Evidence section ----
    if evidence_snippets:
        evidence_lines = []
        for i, e in enumerate(evidence_snippets[:5], 1):
            evidence_lines.append(
                f"  [{i}] ({e.evidence_type.upper()}) {e.source}:\n"
                f"       \"{e.snippet[:250]}\"\n"
                f"       URL: {e.url}"
            )
        evidence_context = "\n".join(evidence_lines)
    else:
        evidence_context = "  No evidence snippets available."

    return f"""You are a strict, neutral fact-checking assistant for an Indian economic claims verifier.

CLAIM TO VERIFY:
  "{claim}"

NUMERIC DATA:
{numeric_context}

EVIDENCE:
{evidence_context}

TASK:
Determine whether the claim is accurate, misleading, false, or unverifiable based ONLY on the data and evidence above.
Do NOT use any external knowledge or make up sources. If the evidence is insufficient, say "unverifiable".

VERDICT DEFINITIONS:
  accurate      — claimed value matches official data within 5% error, or evidence clearly supports the claim
  misleading    — claimed value has 5-20% error, or evidence is mixed/partially supportive
  false         — claimed value has >20% error, or evidence clearly contradicts the claim
  unverifiable  — insufficient data/evidence to make a determination

RESPOND WITH ONLY VALID JSON (no markdown, no extra text):
{{
  "verdict": "<accurate|misleading|false|unverifiable>",
  "confidence": <float between 0.0 and 1.0>,
  "explanation": "<1-3 sentence explanation referencing the specific numbers or sources above>",
  "sources_used": ["<source name 1>", "<source name 2>"]
}}"""


# =============================================================================
# GEMINI API CALLER
# =============================================================================

async def _call_gemini(prompt: str, timeout: float = 20.0) -> str | None:
    """
    Call Gemini 1.5 Flash API with the given prompt.
    Returns raw response text, or None on failure.
    """
    if not GEMINI_API_KEY:
        return None

    url = f"{GEMINI_URL}?key={GEMINI_API_KEY}"
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,       # Low temperature = factual, consistent
            "maxOutputTokens": 512,   # JSON response is always short
            "topP": 0.8,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        # Gemini response shape:
        # { "candidates": [ { "content": { "parts": [ { "text": "..." } ] } } ] }
        return data["candidates"][0]["content"]["parts"][0]["text"]

    except (httpx.HTTPError, KeyError, IndexError, ValueError):
        return None


# =============================================================================
# JSON PARSER
# =============================================================================

def _parse_llm_response(raw: str) -> dict | None:
    """
    Extract and parse the JSON block from Gemini's response.
    Handles cases where the model wraps JSON in markdown code fences.
    """
    if not raw:
        return None

    # Strip markdown fences if present: ```json ... ```
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()

    # Find the first {...} block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        return None

    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

async def tier3_llm_check(
    *,
    claim: str,
    metric: str | None = None,
    claimed_value: float | None = None,
    year: int | None = None,
    official_value: float | None = None,
    percentage_error: float | None = None,
    official_source: str | None = None,
    evidence_snippets: list[EvidenceSummary] | None = None,
) -> Tier3Result:
    """
    Tier 3 verification via Gemini 1.5 Flash.

    Accepts all context collected by Tier 1 and Tier 2 and asks the LLM
    to produce a final verdict + explanation.

    Returns a Tier3Result with verdict, confidence, explanation, and sources used.
    Falls back to an 'unverifiable' result if API call fails or key not set.
    """
    snippets = evidence_snippets or []

    prompt = _build_prompt(
        claim=claim,
        metric=metric,
        claimed_value=claimed_value,
        year=year,
        official_value=official_value,
        percentage_error=percentage_error,
        official_source=official_source,
        evidence_snippets=snippets,
    )

    raw = await _call_gemini(prompt)

    if raw is None:
        return Tier3Result(
            verdict="unverifiable",
            confidence=0.0,
            explanation="Tier 3 LLM unavailable — GEMINI_API_KEY not set or API call failed.",
            sources_used=[],
            raw_response="",
        )

    parsed = _parse_llm_response(raw)

    if parsed is None:
        return Tier3Result(
            verdict="unverifiable",
            confidence=0.0,
            explanation="Tier 3 LLM returned an unparseable response.",
            sources_used=[],
            raw_response=raw,
        )

    # Validate and clamp parsed fields defensively
    verdict = parsed.get("verdict", "unverifiable").lower()
    if verdict not in VALID_VERDICTS:
        verdict = "unverifiable"

    try:
        confidence = float(parsed.get("confidence", 0.0))
        confidence = max(0.0, min(1.0, confidence))  # clamp to [0, 1]
    except (TypeError, ValueError):
        confidence = 0.0

    explanation = str(parsed.get("explanation", "No explanation provided."))
    sources_used = parsed.get("sources_used", [])
    if not isinstance(sources_used, list):
        sources_used = []

    return Tier3Result(
        verdict=verdict,
        confidence=round(confidence, 4),
        explanation=explanation,
        sources_used=sources_used,
        raw_response=raw,
    )
