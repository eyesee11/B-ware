"""
test_tier3_llm.py — Tests for Tier 3: LLM reasoning via Gemini
===============================================================
Run with:  pytest tests/test_tier3_llm.py -v

WHAT WE'RE TESTING:
  - Prompt building: correct structure for all data combinations
  - Response parsing: valid JSON, markdown-wrapped JSON, garbage input
  - Graceful degradation: missing API key, API errors, invalid verdicts
  - End-to-end tier3_llm_check with mocked Gemini responses

WHY WE TEST PARSING SO HEAVILY:
  LLMs are unpredictable. Gemini might return:
    - Clean JSON: {"verdict": "accurate", ...}
    - Markdown-wrapped: ```json\n{"verdict": "accurate", ...}\n```
    - With extra text: "Here's my analysis:\n{...}"
    - Complete garbage: "I cannot determine..."
  Our parser must handle ALL of these. Each test covers one scenario.
"""

import sys
import os
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from unittest.mock import patch, AsyncMock
from verifier.tier3_llm import (
    _build_prompt,
    _parse_llm_response,
    tier3_llm_check,
    EvidenceSummary,
    Tier3Result,
)


# =============================================================================
# PROMPT BUILDING TESTS
# =============================================================================

class TestBuildPrompt:
    """
    _build_prompt constructs the text sent to Gemini.
    It must include ALL available context and handle missing data gracefully.
    """

    def test_full_numeric_data(self):
        """
        When we have official values from Tier 1, the prompt should include
        both the claimed and official numbers plus the percentage error.
        """
        prompt = _build_prompt(
            claim="India's GDP grew 7.5% in 2024",
            metric="GDP growth rate",
            claimed_value=7.5,
            year=2024,
            official_value=6.49,
            percentage_error=15.56,
            official_source="World Bank",
            evidence_snippets=[],
        )
        
        # Check that key numeric data appears in the prompt
        assert "7.5" in prompt           # claimed value
        assert "6.49" in prompt          # official value  
        assert "15.56" in prompt         # percentage error
        assert "World Bank" in prompt    # source
        assert "2024" in prompt          # year
        assert "GDP growth rate" in prompt

    def test_no_numeric_data(self):
        """
        When extraction failed (no metric/value), the prompt should say so
        rather than crash or show 'None'.
        """
        prompt = _build_prompt(
            claim="The economy is doing great",
            metric=None,
            claimed_value=None,
            year=None,
            official_value=None,
            percentage_error=None,
            official_source=None,
            evidence_snippets=[],
        )
        
        assert "No numeric data" in prompt
        assert "None" not in prompt  # Should not leak Python's None into the prompt

    def test_metric_but_no_official_value(self):
        """
        Metric extracted but World Bank has no data.
        Common for metrics like 'fiscal deficit' where data lags.
        """
        prompt = _build_prompt(
            claim="Fiscal deficit was 5.9% in 2025",
            metric="fiscal deficit",
            claimed_value=5.9,
            year=2025,
            official_value=None,
            percentage_error=None,
            official_source=None,
            evidence_snippets=[],
        )
        
        assert "No official numeric data available" in prompt
        assert "5.9" in prompt
        assert "2025" in prompt

    def test_evidence_snippets_included(self):
        """
        When evidence snippets exist, they should appear numbered in the prompt.
        """
        snippets = [
            EvidenceSummary(
                source="Reuters", snippet="India GDP grew 6.5% in 2024",
                url="https://reuters.com/article", evidence_type="news"
            ),
            EvidenceSummary(
                source="AFP Fact Check", snippet="Claim of 7.5% GDP is misleading",
                url="https://factcheck.afp.com/123", evidence_type="fact_check"
            ),
        ]
        
        prompt = _build_prompt(
            claim="GDP grew 7.5%", metric="GDP growth rate",
            claimed_value=7.5, year=2024,
            official_value=6.49, percentage_error=15.56,
            official_source="World Bank",
            evidence_snippets=snippets,
        )
        
        assert "Reuters" in prompt
        assert "AFP Fact Check" in prompt
        assert "[1]" in prompt  # Numbered evidence
        assert "[2]" in prompt
        assert "NEWS" in prompt        # evidence_type shown in uppercase
        assert "FACT_CHECK" in prompt

    def test_prompt_has_verdict_definitions(self):
        """
        The prompt must always include verdict definitions so the LLM
        knows our exact thresholds and vocabulary.
        """
        prompt = _build_prompt(
            claim="test", metric=None, claimed_value=None, year=None,
            official_value=None, percentage_error=None,
            official_source=None, evidence_snippets=[],
        )
        
        assert "accurate" in prompt
        assert "misleading" in prompt
        assert "false" in prompt
        assert "unverifiable" in prompt
        assert "RESPOND WITH ONLY VALID JSON" in prompt


# =============================================================================
# RESPONSE PARSING TESTS
# =============================================================================

class TestParseResponse:
    """
    _parse_llm_response must extract valid JSON from messy LLM output.
    
    WHY THIS IS CRITICAL:
      If parsing fails, tier3_llm_check returns "unverifiable" — which means
      we wasted an API call and the user gets no useful answer. Every edge
      case we handle here = fewer false "unverifiable" results.
    """

    def test_clean_json(self):
        """Perfect JSON — the happy path."""
        raw = '{"verdict": "accurate", "confidence": 0.92, "explanation": "Data matches.", "sources_used": ["World Bank"]}'
        result = _parse_llm_response(raw)
        
        assert result is not None
        assert result["verdict"] == "accurate"
        assert result["confidence"] == 0.92
        assert result["explanation"] == "Data matches."
        assert result["sources_used"] == ["World Bank"]

    def test_markdown_wrapped_json(self):
        """
        LLMs often wrap JSON in ```json ... ``` markdown blocks.
        Our parser strips these wrappers.
        """
        raw = '```json\n{"verdict": "misleading", "confidence": 0.71, "explanation": "Error is 15%.", "sources_used": []}\n```'
        result = _parse_llm_response(raw)
        
        assert result is not None
        assert result["verdict"] == "misleading"

    def test_json_with_extra_text(self):
        """
        LLM adds conversational text before/after the JSON.
        Our regex extracts the {...} block.
        """
        raw = 'Here is my analysis:\n\n{"verdict": "false", "confidence": 0.88, "explanation": "Clearly wrong.", "sources_used": ["Reuters"]}\n\nHope this helps!'
        result = _parse_llm_response(raw)
        
        assert result is not None
        assert result["verdict"] == "false"

    def test_garbage_input_returns_none(self):
        """Completely unparseable text → None."""
        assert _parse_llm_response("I cannot determine the accuracy.") is None
        assert _parse_llm_response("") is None
        assert _parse_llm_response(None) is None

    def test_invalid_json_returns_none(self):
        """Malformed JSON (missing quotes, trailing commas) → None."""
        raw = '{verdict: accurate, confidence: 0.9}'  # missing quotes
        assert _parse_llm_response(raw) is None


# =============================================================================
# END-TO-END TIER 3 TESTS (with mocked Gemini API)
# =============================================================================

class TestTier3LlmCheck:
    """
    Tests for the full tier3_llm_check function.
    
    MOCKING STRATEGY:
      We mock _call_gemini (the HTTP call to Gemini) not the whole function.
      This way we still test:
        - Prompt building
        - Response parsing
        - Verdict normalization
        - Confidence clamping
      Only the actual HTTP call is faked.
    
    AsyncMock vs MagicMock:
      _call_gemini is an async function (async def _call_gemini).
      Regular MagicMock doesn't work with `await`. AsyncMock does.
    """

    @patch("verifier.tier3_llm._call_gemini", new_callable=AsyncMock)
    def test_successful_analysis(self, mock_gemini):
        """Happy path: Gemini returns valid JSON."""
        mock_gemini.return_value = '{"verdict": "accurate", "confidence": 0.95, "explanation": "The claimed GDP growth of 7.5% matches World Bank data.", "sources_used": ["World Bank"]}'
        
        result = asyncio.run(tier3_llm_check(
            claim="GDP grew 7.5% in 2024",
            metric="GDP growth rate",
            claimed_value=7.5,
            year=2024,
            official_value=7.48,
            percentage_error=0.27,
            official_source="World Bank",
        ))
        
        assert isinstance(result, Tier3Result)
        assert result.verdict == "accurate"
        assert result.confidence == 0.95
        assert "World Bank" in result.sources_used

    @patch("verifier.tier3_llm._call_gemini", new_callable=AsyncMock)
    def test_no_api_key(self, mock_gemini):
        """
        When GEMINI_API_KEY is not set, _call_gemini returns None.
        tier3_llm_check should return 'unverifiable' gracefully.
        
        WHY THIS MATTERS:
          In development, your teammates might not have a Gemini key.
          The system should degrade gracefully, not crash.
        """
        mock_gemini.return_value = None  # simulates no API key
        
        result = asyncio.run(tier3_llm_check(claim="GDP grew 7.5%"))
        
        assert result.verdict == "unverifiable"
        assert result.confidence == 0.0
        assert "unavailable" in result.explanation.lower() or "unparseable" in result.explanation.lower()

    @patch("verifier.tier3_llm._call_gemini", new_callable=AsyncMock)
    def test_invalid_verdict_normalized(self, mock_gemini):
        """
        If Gemini returns a verdict not in our vocabulary (e.g., "partially true"),
        it should be normalized to 'unverifiable'.
        
        WHY:
          The frontend expects exactly 4 verdict strings for color coding.
          Any other string would break the UI.
        """
        mock_gemini.return_value = '{"verdict": "partially true", "confidence": 0.7, "explanation": "Some parts are right.", "sources_used": []}'
        
        result = asyncio.run(tier3_llm_check(claim="GDP grew 7.5%"))
        
        assert result.verdict == "unverifiable"  # normalized from "partially true"

    @patch("verifier.tier3_llm._call_gemini", new_callable=AsyncMock)
    def test_confidence_clamped_to_range(self, mock_gemini):
        """
        If Gemini returns confidence > 1.0 or < 0.0, it should be clamped.
        
        WHY:
          LLMs sometimes return 95 instead of 0.95, or -0.1 for uncertainty.
          Clamping to [0.0, 1.0] prevents UI bugs (progress bars overflowing, etc).
        """
        mock_gemini.return_value = '{"verdict": "accurate", "confidence": 95.0, "explanation": "Sure.", "sources_used": []}'
        
        result = asyncio.run(tier3_llm_check(claim="GDP grew 7.5%"))
        
        assert result.confidence == 1.0  # clamped from 95.0

    @patch("verifier.tier3_llm._call_gemini", new_callable=AsyncMock)
    def test_unparseable_response(self, mock_gemini):
        """Gemini returns non-JSON text → graceful degradation."""
        mock_gemini.return_value = "I'm sorry, I cannot verify economic claims."
        
        result = asyncio.run(tier3_llm_check(claim="GDP grew 7.5%"))
        
        assert result.verdict == "unverifiable"
        assert result.raw_response == "I'm sorry, I cannot verify economic claims."