"""
test_verdict_router.py — Tests for the RAV engine orchestrator
==============================================================
Run with:  pytest tests/test_verdict_router.py -v

WHAT WE'RE TESTING:
  - Verdict rule functions: _verdict_from_error, _nli_to_verdict
  - Routing logic: when does Tier 1 short-circuit? When does it escalate?
  - force_tier3: does it bypass all early returns?

MOCKING STRATEGY:
  We mock ALL three tier functions + the extractor + evidence fetcher.
  This isolates the ROUTING LOGIC from the actual verification logic.
  
  Think of it like testing a traffic signal controller:
  - We don't care if the roads actually have cars
  - We care that the lights change at the right times
  - So we simulate "cars detected" and check which light turns green

MOCK HIERARCHY (what calls what):
  route_verification
    ├── extract_all            ← mocked (no regex needed)
    ├── tier1_numeric_check    ← mocked (no World Bank API call)
    ├── fetch_evidence         ← mocked (no NewsAPI/Google call)
    ├── run_nli                ← mocked (no BART model)
    └── tier3_llm_check        ← mocked (no Gemini call)
"""

import sys
import os
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from unittest.mock import patch, AsyncMock, MagicMock
from verifier.verdict_router import (
    _verdict_from_error,
    _nli_to_verdict,
    route_verification,
    VerificationResult,
    TIER1_ERROR_CLEAR_LOW,
    TIER1_ERROR_CLEAR_HIGH,
    TIER2_CONFIDENCE_MIN,
)
from verifier.tier1_numeric import WorldBankNumericCheck
from verifier.tier2_nli import Tier2Result, NliResult
from verifier.tier3_llm import Tier3Result
from verifier.evidence_fetcher import EvidenceSnippet


# =============================================================================
# VERDICT RULE TESTS (pure functions, no mocking needed)
# =============================================================================

class TestVerdictFromError:
    """
    _verdict_from_error maps percentage_error → verdict string.
    
    These are the SAME thresholds used in /verify/quick.
    By centralizing them in verdict_router.py, we ensure consistency
    across all endpoints.
    """

    def test_none_returns_unverifiable(self):
        """No data at all → can't make a judgment."""
        assert _verdict_from_error(None) == "unverifiable"

    def test_zero_error_is_accurate(self):
        """0% error = exact match = accurate."""
        assert _verdict_from_error(0.0) == "accurate"

    def test_below_5_is_accurate(self):
        """4.99% error → within tolerance → accurate."""
        assert _verdict_from_error(4.99) == "accurate"

    def test_exactly_5_is_misleading(self):
        """5.0% is AT the boundary → misleading (not accurate)."""
        assert _verdict_from_error(5.0) == "misleading"

    def test_between_5_and_20_is_misleading(self):
        """15% error → misleading range."""
        assert _verdict_from_error(15.0) == "misleading"

    def test_exactly_20_is_false(self):
        """20.0% is AT the boundary → false."""
        assert _verdict_from_error(20.0) == "false"

    def test_above_20_is_false(self):
        """50% error → clearly false."""
        assert _verdict_from_error(50.0) == "false"


class TestNliToVerdict:
    """
    _nli_to_verdict maps NLI aggregated labels to our verdict vocabulary.
    
    WHY THE MAPPING EXISTS:
      NLI models speak in terms of entailment/contradiction/neutral.
      Our API speaks in terms of accurate/false/unverifiable.
      This function is the translation layer.
    """

    def test_entailment_maps_to_accurate(self):
        assert _nli_to_verdict("entailment") == "accurate"

    def test_contradiction_maps_to_false(self):
        assert _nli_to_verdict("contradiction") == "false"

    def test_neutral_maps_to_unverifiable(self):
        assert _nli_to_verdict("neutral") == "unverifiable"

    def test_insufficient_evidence_maps_to_unverifiable(self):
        assert _nli_to_verdict("insufficient_evidence") == "unverifiable"

    def test_unknown_maps_to_unverifiable(self):
        """Safety net: any unrecognized label → unverifiable."""
        assert _nli_to_verdict("something_weird") == "unverifiable"


# =============================================================================
# ROUTING LOGIC TESTS (full mocking)
# =============================================================================

# Helper: create a standard extraction result
def _fake_extraction(metric="GDP growth rate", value=7.5, year=2024, confidence=0.9):
    return {
        "original_text": f"Claims {metric} was {value} in {year}",
        "metric": metric, "value": value, "year": year,
        "confidence": confidence,
    }

# Helper: create a Tier 1 result
def _fake_t1(official_value=6.49, percentage_error=15.56):
    return WorldBankNumericCheck(
        official_value=official_value, claimed_value=7.5,
        percentage_error=percentage_error, source="World Bank",
        indicator_code="NY.GDP.MKTP.KD.ZG",
        source_url="https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=IN",
        year=2024,
    )


class TestRoutingLogic:
    """
    Tests for the main route_verification function.
    
    IMPORTANT: We patch at the IMPORT PATH, not the definition path.
    verdict_router.py does: from extractor import extract_all
    So we patch "verifier.verdict_router.extract_all" not "extractor.extract_all".
    This is a common pytest gotcha!
    """

    @patch("verifier.verdict_router.tier1_numeric_check", new_callable=AsyncMock)
    @patch("verifier.verdict_router.extract_all")
    def test_tier1_fast_path_accurate(self, mock_extract, mock_t1):
        """
        SCENARIO: High extraction confidence + low error → Tier 1 alone is enough.
        
        Conditions for fast path (all must be true):
          1. official_value is not None (World Bank returned data)
          2. percentage_error < 5% OR >= 20% (clear-cut case)
          3. extraction confidence >= 0.8
          4. force_tier3 is False
        
        Result: Returns immediately with tier_used="tier1", skips Tier 2/3.
        """
        mock_extract.return_value = _fake_extraction(confidence=0.9)
        mock_t1.return_value = _fake_t1(official_value=7.48, percentage_error=0.27)
        
        result = asyncio.run(route_verification("GDP grew 7.5% in 2024"))
        
        assert result.tier_used == "tier1"
        assert result.verdict == "accurate"  # 0.27% error < 5%
        assert result.tiers_run == ["tier1"]
        assert result.evidence == []  # No evidence fetched

    @patch("verifier.verdict_router.tier1_numeric_check", new_callable=AsyncMock)
    @patch("verifier.verdict_router.extract_all")
    def test_tier1_fast_path_false(self, mock_extract, mock_t1):
        """
        SCENARIO: Clear error >= 20% → Tier 1 says 'false', no escalation.
        """
        mock_extract.return_value = _fake_extraction(confidence=0.9)
        mock_t1.return_value = _fake_t1(official_value=5.0, percentage_error=50.0)
        
        result = asyncio.run(route_verification("GDP grew 7.5% in 2024"))
        
        assert result.tier_used == "tier1"
        assert result.verdict == "false"  # 50% error >= 20%

    @patch("verifier.verdict_router.run_nli", new_callable=AsyncMock)
    @patch("verifier.verdict_router.fetch_evidence", new_callable=AsyncMock)
    @patch("verifier.verdict_router.tier1_numeric_check", new_callable=AsyncMock)
    @patch("verifier.verdict_router.extract_all")
    def test_escalates_to_tier2_ambiguous_error(self, mock_extract, mock_t1, mock_evidence, mock_nli):
        """
        SCENARIO: Error is 15% (ambiguous zone 5-20%) → escalates to Tier 2.
        Tier 2 is confident (0.72 >= 0.6) → returns merged result.
        
        WHY ESCALATION:
          15% error is in the "misleading" zone, but we're not 100% sure.
          Maybe the World Bank data is outdated, or the metric was misidentified.
          Tier 2 checks news evidence to build more confidence.
        """
        mock_extract.return_value = _fake_extraction(confidence=0.9)
        mock_t1.return_value = _fake_t1(official_value=6.49, percentage_error=15.56)
        mock_evidence.return_value = [
            EvidenceSnippet(source="Reuters", title="GDP Report", 
                          snippet="India GDP grew at 6.5 percent in fiscal 2024",
                          url="https://reuters.com", published_date="2024-06-01",
                          evidence_type="news"),
        ]
        mock_nli.return_value = Tier2Result(
            verdict="contradiction", confidence=0.72,
            nli_results=[NliResult(label="contradiction", score=0.72,
                                   snippet_source="Reuters",
                                   snippet_text="India GDP grew at 6.5 percent")],
            evidence_count=1,
        )
        
        result = asyncio.run(route_verification("GDP grew 7.5% in 2024"))
        
        assert result.tier_used == "tier2"
        assert result.tiers_run == ["tier1", "tier2"]
        assert len(result.evidence) == 1
        # Numeric verdict (misleading) overrides NLI because we have official data
        assert result.verdict == "misleading"

    @patch("verifier.verdict_router.tier3_llm_check", new_callable=AsyncMock)
    @patch("verifier.verdict_router.run_nli", new_callable=AsyncMock)
    @patch("verifier.verdict_router.fetch_evidence", new_callable=AsyncMock)
    @patch("verifier.verdict_router.tier1_numeric_check", new_callable=AsyncMock)
    @patch("verifier.verdict_router.extract_all")
    def test_escalates_to_tier3_low_nli_confidence(
        self, mock_extract, mock_t1, mock_evidence, mock_nli, mock_t3
    ):
        """
        SCENARIO: Tier 2 confidence < 0.6 → escalates to Tier 3.
        
        This happens when evidence snippets are mixed or irrelevant,
        so the NLI model can't reach a confident conclusion.
        """
        mock_extract.return_value = _fake_extraction(confidence=0.9)
        mock_t1.return_value = _fake_t1(official_value=6.49, percentage_error=15.56)
        mock_evidence.return_value = []
        mock_nli.return_value = Tier2Result(
            verdict="neutral", confidence=0.35,  # <0.6 threshold
            nli_results=[], evidence_count=0,
        )
        mock_t3.return_value = Tier3Result(
            verdict="misleading", confidence=0.82,
            explanation="The claimed 7.5% exceeds the World Bank figure of 6.49%.",
            sources_used=["World Bank"],
            raw_response="...",
        )
        
        result = asyncio.run(route_verification("GDP grew 7.5% in 2024"))
        
        assert result.tier_used == "tier3"
        assert result.tiers_run == ["tier1", "tier2", "tier3"]
        assert result.verdict == "misleading"
        assert result.confidence == 0.82

    @patch("verifier.verdict_router.tier3_llm_check", new_callable=AsyncMock)
    @patch("verifier.verdict_router.run_nli", new_callable=AsyncMock)
    @patch("verifier.verdict_router.fetch_evidence", new_callable=AsyncMock)
    @patch("verifier.verdict_router.tier1_numeric_check", new_callable=AsyncMock)
    @patch("verifier.verdict_router.extract_all")
    def test_force_tier3_bypasses_early_returns(
        self, mock_extract, mock_t1, mock_evidence, mock_nli, mock_t3
    ):
        """
        SCENARIO: force_tier3=True (from /verify/deep endpoint).
        
        Even though Tier 1 has a decisive result (0.27% error, clearly accurate),
        we force execution through ALL tiers because the user explicitly
        requested deep analysis.
        """
        mock_extract.return_value = _fake_extraction(confidence=0.9)
        # Tier 1 is decisive (would normally short-circuit)
        mock_t1.return_value = _fake_t1(official_value=7.48, percentage_error=0.27)
        mock_evidence.return_value = []
        mock_nli.return_value = Tier2Result(
            verdict="entailment", confidence=0.85,
            nli_results=[], evidence_count=0,
        )
        mock_t3.return_value = Tier3Result(
            verdict="accurate", confidence=0.96,
            explanation="All sources confirm the claim.",
            sources_used=["World Bank"], raw_response="...",
        )
        
        result = asyncio.run(route_verification(
            "GDP grew 7.5% in 2024", force_tier3=True
        ))
        
        assert result.tier_used == "tier3"  # NOT tier1, even though it was decisive
        assert result.tiers_run == ["tier1", "tier2", "tier3"]  # ALL tiers ran

    @patch("verifier.verdict_router.tier1_numeric_check", new_callable=AsyncMock)
    @patch("verifier.verdict_router.extract_all")
    def test_low_extraction_confidence_skips_fast_path(self, mock_extract, mock_t1):
        """
        SCENARIO: extraction confidence = 0.6 (below 0.8 threshold).
        
        Even though Tier 1 error is clear (<5%), low extraction confidence
        means we might have the WRONG metric. So we don't trust Tier 1
        alone and escalate to Tier 2 for evidence-based backup.
        
        This is controlled by TIER1_STRONG_THRESHOLD = 0.8 in verdict_router.py.
        """
        mock_extract.return_value = _fake_extraction(confidence=0.6)  # Below 0.8
        mock_t1.return_value = _fake_t1(official_value=7.48, percentage_error=0.27)
        
        # Since this will try to go to Tier 2, we need those mocks too
        with patch("verifier.verdict_router.fetch_evidence", new_callable=AsyncMock) as mock_ev, \
             patch("verifier.verdict_router.run_nli", new_callable=AsyncMock) as mock_nli:
            mock_ev.return_value = []
            mock_nli.return_value = Tier2Result(
                verdict="entailment", confidence=0.75,
                nli_results=[], evidence_count=0,
            )
            
            result = asyncio.run(route_verification("GDP grew 7.5% in 2024"))
        
        assert result.tier_used != "tier1"  # Did NOT take the fast path
        assert "tier2" in result.tiers_run