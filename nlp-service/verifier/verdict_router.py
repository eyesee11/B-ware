"""
verdict_router.py — RAV Engine Orchestrator

Single entry point for the full verification pipeline.
Decides which tier(s) to run based on extraction confidence and tier results.

Routing logic:
  1. Always run Layer 1 extraction (extractor.py)
  2. If metric + value + year extracted → run Tier 1 (World Bank numeric check)
     - If Tier 1 percentage_error is clear (< 5% or >= 20%) AND
       extraction confidence > 0.8 → return immediately, skip Tier 2/3
  3. Otherwise → run Tier 2 (evidence fetch + NLI)
     - If Tier 2 confidence >= 0.6 → merge Tier 1 + Tier 2 and return
  4. Otherwise → escalate to Tier 3 (Gemini LLM)

force_tier3=True bypasses the router and always runs all tiers up to Tier 3.
This is used by POST /verify/deep.
"""

from __future__ import annotations

import asyncio
import hashlib
import time
from dataclasses import dataclass, field

from extractor import extract_all
from verifier.tier1_numeric import tier1_numeric_check, WorldBankNumericCheck
from verifier.evidence_fetcher import fetch_evidence, EvidenceSnippet
from verifier.tier2_nli import run_nli, Tier2Result
from verifier.tier3_llm import tier3_llm_check, EvidenceSummary, Tier3Result

# Confidence thresholds — tunable without changing logic
TIER1_STRONG_THRESHOLD = 0.8   # extraction confidence above which Tier 1 alone is trusted
TIER1_ERROR_CLEAR_LOW  = 5.0   # % error below this → definitely accurate
TIER1_ERROR_CLEAR_HIGH = 20.0  # % error above this → definitely false
TIER2_CONFIDENCE_MIN   = 0.6   # Tier 2 confidence below this → escalate to Tier 3


# =============================================================================
# L1 RESULT CACHE — avoids re-running the full pipeline for duplicate claims
# =============================================================================

class _ResultCache:
    """
    In-process TTL cache for VerificationResult objects.
    Keyed on MD5(text) + force_tier3 — same claim + same depth = same result.
    TTL: 1 hour. Saves World Bank + NewsAPI + Gemini quota on repeated claims.

    The Node backend also caches in Redis (L2 cache). This is the L1 cache
    inside the NLP service itself — prevents any external API calls on hits.
    """
    def __init__(self, ttl_seconds: int = 3600):
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[float, object]] = {}

    def _key(self, text: str, force_tier3: bool) -> str:
        return hashlib.md5(text.encode()).hexdigest() + f":{force_tier3}"

    def get(self, text: str, force_tier3: bool):
        entry = self._store.get(self._key(text, force_tier3))
        if entry is None:
            return None
        stored_at, result = entry
        if time.monotonic() - stored_at > self._ttl:
            del self._store[self._key(text, force_tier3)]
            return None
        return result

    def set(self, text: str, force_tier3: bool, result) -> None:
        self._store[self._key(text, force_tier3)] = (time.monotonic(), result)

    def clear(self) -> None:
        """Evict all cached entries. Used in tests to prevent cross-test pollution."""
        self._store.clear()


_result_cache = _ResultCache()


# =============================================================================
# RESPONSE SHAPE
# =============================================================================

@dataclass
class EvidenceItem:
    """One evidence snippet as returned in the final API response."""
    source: str
    snippet: str
    url: str
    evidence_type: str      # "fact_check" | "news"
    nli_verdict: str | None = None   # populated if Tier 2 ran
    nli_score: float | None = None


@dataclass
class VerificationResult:
    """
    Unified response shape returned by the router for all /verify endpoints.
    Pydantic models in main.py mirror this structure.
    """
    original_text: str
    tier_used: str          # "tier1" | "tier2" | "tier3"
    verdict: str            # "accurate" | "misleading" | "false" | "unverifiable"
    confidence: float       # 0.0 → 1.0

    # Extraction fields
    extracted_metric: str | None
    extracted_value: float | None
    extracted_year: int | None
    extraction_confidence: float

    # Tier 1
    official_value: float | None = None
    percentage_error: float | None = None
    official_source: str | None = None
    indicator_code: str | None = None
    source_url: str | None = None

    # Tier 2 / 3
    evidence: list[EvidenceItem] = field(default_factory=list)
    explanation: str = ""

    # Debug
    tiers_run: list[str] = field(default_factory=list)


# =============================================================================
# VERDICT RULE (same as /verify/quick, centralised here)
# =============================================================================

def _verdict_from_error(pct_error: float | None) -> str:
    if pct_error is None:
        return "unverifiable"
    if pct_error < TIER1_ERROR_CLEAR_LOW:
        return "accurate"
    if pct_error < TIER1_ERROR_CLEAR_HIGH:
        return "misleading"
    return "false"


def _nli_to_verdict(nli_verdict: str) -> str:
    """Map NLI aggregated label to our verdict vocabulary."""
    mapping = {
        "entailment": "accurate",
        "contradiction": "false",
        "neutral": "unverifiable",
        "insufficient_evidence": "unverifiable",
    }
    return mapping.get(nli_verdict, "unverifiable")


# =============================================================================
# MAIN ROUTER
# =============================================================================

async def route_verification(
    text: str,
    force_tier3: bool = False,
) -> VerificationResult:
    """
    Full RAV pipeline.

    Args:
        text:        Raw claim text from the user.
        force_tier3: If True, always runs through to Tier 3 (used by /verify/deep).

    Returns:
        VerificationResult with the best available verdict and all evidence.
    """
    tiers_run: list[str] = []

    # ──────────────────────────────────────────────────────────────────────
    # L1 CACHE CHECK — return immediately for duplicate claims
    # ──────────────────────────────────────────────────────────────────────
    cached = _result_cache.get(text, force_tier3)
    if cached is not None:
        return cached

    # ──────────────────────────────────────────────────────────────────────
    # LAYER 1: Extract metric / value / year
    # ──────────────────────────────────────────────────────────────────────
    extraction = extract_all(text)
    metric    = extraction["metric"]
    value     = extraction["value"]
    year      = extraction["year"]
    country   = extraction.get("country", "IND") or "IND"   # N-19
    ext_conf  = extraction["confidence"]

    base = dict(
        original_text=text,
        extracted_metric=metric,
        extracted_value=value,
        extracted_year=year,
        extraction_confidence=ext_conf,
    )

    # ──────────────────────────────────────────────────────────────────────
    # TIER 1: Numeric check via World Bank
    # ──────────────────────────────────────────────────────────────────────
    t1: WorldBankNumericCheck = await tier1_numeric_check(
        metric=metric,
        claimed_value=value,
        year=year,
        country=country,   # N-19: use detected country instead of always IND
    )
    tiers_run.append("tier1")

    tier1_verdict = _verdict_from_error(t1.percentage_error)

    # Build tier1 confidence: extraction conf weighted by how low % error is
    if t1.official_value is not None and t1.percentage_error is not None:
        tier1_quality = max(0.0, 1.0 - (t1.percentage_error / 100.0))
        tier1_conf = round(ext_conf * tier1_quality, 2)
    else:
        tier1_conf = 0.0

    # Fast-path: Tier 1 alone is decisive AND not forcing deep analysis
    tier1_decisive = (
        t1.official_value is not None
        and t1.percentage_error is not None
        and ext_conf >= TIER1_STRONG_THRESHOLD
        and (
            t1.percentage_error < TIER1_ERROR_CLEAR_LOW
            or t1.percentage_error >= TIER1_ERROR_CLEAR_HIGH
        )
    )

    if tier1_decisive and not force_tier3:
        explanation = (
            f"Claimed {metric}: {value} ({year}). "
            f"Official World Bank value: {t1.official_value:.4f}. "
            f"Percentage error: {t1.percentage_error:.2f}%. "
            f"Verdict: {tier1_verdict}."
        )
        _t1_result = VerificationResult(
            **base,
            tier_used="tier1",
            verdict=tier1_verdict,
            confidence=tier1_conf,
            official_value=t1.official_value,
            percentage_error=t1.percentage_error,
            official_source=t1.source,
            indicator_code=t1.indicator_code,
            source_url=t1.source_url,
            explanation=explanation,
            tiers_run=tiers_run,
        )
        _result_cache.set(text, force_tier3, _t1_result)
        return _t1_result

    # ──────────────────────────────────────────────────────────────────────
    # TIER 2: Evidence fetch + NLI
    # ──────────────────────────────────────────────────────────────────────
    raw_snippets: list[EvidenceSnippet] = await fetch_evidence(
        metric=metric,
        year=year,
        claimed_value=value,
    )

    t2: Tier2Result = await run_nli(claim=text, snippets=raw_snippets)
    tiers_run.append("tier2")

    # Build EvidenceItem list with NLI scores attached
    nli_map: dict[str, tuple[str, float]] = {}
    for r in t2.nli_results:
        nli_map[r.snippet_text[:50]] = (r.label, r.score)

    evidence_items: list[EvidenceItem] = []
    for s in raw_snippets:
        snippet_key = (s.snippet or s.title or "")[:50]
        nli_label, nli_score = nli_map.get(snippet_key, (None, None))
        evidence_items.append(EvidenceItem(
            source=s.source,
            snippet=s.snippet or s.title or "",
            url=s.url,
            evidence_type=s.evidence_type,
            nli_verdict=nli_label,
            nli_score=nli_score,
        ))

    # Merge Tier 1 numeric + Tier 2 NLI into a combined verdict
    tier2_verdict = _nli_to_verdict(t2.verdict)

    # If Tier 1 had an official value, it overrides "unverifiable" from Tier 2
    if tier1_verdict != "unverifiable" and t1.official_value is not None:
        merged_verdict = tier1_verdict   # numeric data is more authoritative
        merged_conf = round((tier1_conf + t2.confidence) / 2, 2)
    else:
        merged_verdict = tier2_verdict
        merged_conf = round(t2.confidence, 2)

    # Tier 2 is confident enough — return without LLM
    if t2.confidence >= TIER2_CONFIDENCE_MIN and not force_tier3:
        explanation = _build_merged_explanation(
            metric, value, year, t1, tier1_verdict, t2, tier2_verdict
        )
        _t2_result = VerificationResult(
            **base,
            tier_used="tier2",
            verdict=merged_verdict,
            confidence=merged_conf,
            official_value=t1.official_value,
            percentage_error=t1.percentage_error,
            official_source=t1.source,
            indicator_code=t1.indicator_code,
            source_url=t1.source_url,
            evidence=evidence_items,
            explanation=explanation,
            tiers_run=tiers_run,
        )
        _result_cache.set(text, force_tier3, _t2_result)
        return _t2_result

    # ──────────────────────────────────────────────────────────────────────
    # TIER 3: Gemini LLM
    # ──────────────────────────────────────────────────────────────────────
    evidence_summaries = [
        EvidenceSummary(
            source=e.source,
            snippet=e.snippet,
            url=e.url,
            evidence_type=e.evidence_type,
        )
        for e in evidence_items
    ]

    t3: Tier3Result = await tier3_llm_check(
        claim=text,
        metric=metric,
        claimed_value=value,
        year=year,
        official_value=t1.official_value,
        percentage_error=t1.percentage_error,
        official_source=t1.source,
        evidence_snippets=evidence_summaries,
    )
    tiers_run.append("tier3")

    _t3_result = VerificationResult(
        **base,
        tier_used="tier3",
        verdict=t3.verdict,
        confidence=t3.confidence,
        official_value=t1.official_value,
        percentage_error=t1.percentage_error,
        official_source=t1.source,
        indicator_code=t1.indicator_code,
        source_url=t1.source_url,
        evidence=evidence_items,
        explanation=t3.explanation,
        tiers_run=tiers_run,
    )
    _result_cache.set(text, force_tier3, _t3_result)
    return _t3_result


# =============================================================================
# HELPERS
# =============================================================================

def _build_merged_explanation(
    metric, value, year, t1, tier1_verdict, t2, tier2_verdict
) -> str:
    parts = []
    if t1.official_value is not None:
        parts.append(
            f"Numeric check: claimed {metric} = {value} ({year}), "
            f"official World Bank = {t1.official_value:.4f} "
            f"(error: {t1.percentage_error:.2f}%) → {tier1_verdict}."
        )
    if t2.evidence_count > 0:
        parts.append(
            f"Evidence check: {t2.evidence_count} snippet(s) reviewed, "
            f"NLI verdict = {t2.verdict} (confidence: {t2.confidence:.2f}) → {tier2_verdict}."
        )
    if not parts:
        return "Insufficient data to produce a detailed explanation."
    return " ".join(parts)
