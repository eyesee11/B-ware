"""
test_tier2_nli.py — Tests for Tier 2: NLI evidence scoring
===========================================================
Run with:  pytest tests/test_tier2_nli.py -v

WHAT WE'RE TESTING:
  - Label mapping (_map_label): raw HuggingFace labels → our NLI vocabulary
  - Empty/short input handling: graceful degradation when no evidence
  - Aggregation logic: majority voting across multiple snippets
  - Confidence averaging: math correctness

WHY WE MOCK:
  The real NLI pipeline downloads a 1.6GB model from HuggingFace.
  In tests, we replace _run_nli_sync with a fake that returns
  predictable results instantly. This way:
    - Tests run in <1 second (not 30+ seconds for model download)
    - Tests work offline (no internet needed)  
    - Tests are deterministic (same input → always same output)

HOW MOCKING WORKS:
  @patch("verifier.tier2_nli._run_nli_sync")
  def test_something(self, mock_nli):
      mock_nli.return_value = {"labels": [...], "scores": [...]}
  
  This says: "Wherever _run_nli_sync is called inside tier2_nli.py,
  don't actually call it — use this fake return value instead."

  The mock object is passed as the LAST parameter to the test function
  (after self). If you have multiple @patch decorators, they're passed
  in REVERSE order (bottom decorator → first parameter).
"""

import sys
import os
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from unittest.mock import patch, MagicMock
from verifier.tier2_nli import run_nli, _map_label, Tier2Result, NliResult
from verifier.evidence_fetcher import EvidenceSnippet


# =============================================================================
# HELPER: Create fake evidence snippets for testing
# =============================================================================

def _make_snippet(text: str, source: str = "TestSource") -> EvidenceSnippet:
    """
    Factory function to create EvidenceSnippet objects for tests.
    
    WHY A HELPER?
      EvidenceSnippet has 6 fields. Writing them out every time is tedious
      and makes tests harder to read. This helper provides sensible defaults
      so each test only specifies what matters (the text content).
    """
    return EvidenceSnippet(
        source=source,
        title=f"Article about {text[:30]}",
        snippet=text,
        url="https://example.com/article",
        published_date="2024-01-15",
        evidence_type="news",
    )


# =============================================================================
# LABEL MAPPING TESTS
# =============================================================================

class TestMapLabel:
    """
    _map_label converts HuggingFace's zero-shot labels to our NLI vocabulary.
    
    The pipeline returns labels like "supports the claim" but we need
    standard NLI terms: entailment, contradiction, neutral.
    """

    def test_supports_maps_to_entailment(self):
        """'supports the claim' → 'entailment'"""
        assert _map_label("supports the claim") == "entailment"

    def test_contradicts_maps_to_contradiction(self):
        """'contradicts the claim' → 'contradiction'"""
        assert _map_label("contradicts the claim") == "contradiction"

    def test_unrelated_maps_to_neutral(self):
        """'unrelated to the claim' → 'neutral'"""
        assert _map_label("unrelated to the claim") == "neutral"

    def test_unknown_label_maps_to_neutral(self):
        """Any unrecognized label defaults to 'neutral' (safe fallback)."""
        assert _map_label("something unexpected") == "neutral"

    def test_case_insensitive(self):
        """Label matching should be case-insensitive."""
        assert _map_label("SUPPORTS the claim") == "entailment"
        assert _map_label("Contradicts The Claim") == "contradiction"


# =============================================================================
# EMPTY / SHORT INPUT TESTS
# =============================================================================

class TestRunNliEdgeCases:
    """
    Tests for run_nli when input is empty or too short.
    No mocking needed — these paths never reach the NLI model.
    """

    def test_empty_snippets_returns_insufficient_evidence(self):
        """
        No evidence at all → verdict should be 'insufficient_evidence'.
        
        WHY:
          If the evidence fetcher found 0 results (API down, no matches),
          we can't make any NLI judgment. 'insufficient_evidence' tells
          the verdict router to escalate to Tier 3.
        """
        result = asyncio.run(run_nli(claim="GDP grew 7.5%", snippets=[]))
        
        assert result.verdict == "insufficient_evidence"
        assert result.confidence == 0.0
        assert result.nli_results == []
        assert result.evidence_count == 0

    def test_snippets_too_short_are_skipped(self):
        """
        Snippets shorter than 10 characters are skipped.
        
        WHY:
          Tiny snippets like "N/A" or "..." would produce garbage NLI scores.
          The 10-char minimum filters them out. If ALL snippets are too short,
          we get insufficient_evidence (same as empty).
        """
        short_snippets = [
            _make_snippet("short"),      # 5 chars — skipped
            _make_snippet("tiny"),       # 4 chars — skipped
            _make_snippet(""),           # 0 chars — skipped
        ]
        result = asyncio.run(run_nli(
            claim="GDP grew 7.5%",
            snippets=short_snippets
        ))
        
        assert result.verdict == "insufficient_evidence"
        assert result.evidence_count == 0


# =============================================================================
# AGGREGATION TESTS (with mocked NLI model)
# =============================================================================

class TestNliAggregation:
    """
    Tests for the majority voting + confidence averaging logic.
    
    HOW MAJORITY VOTING WORKS (from tier2_nli.py):
      1. Each snippet gets an NLI label (entailment/contradiction/neutral)
      2. We count how many snippets got each label
      3. The label with the most votes wins
      4. If tied, the label with the highest total score wins
      5. Confidence = average score of the winning label's snippets
    
    We mock _run_nli_sync to control exactly what the model "returns".
    """

    @patch("verifier.tier2_nli._run_nli_sync")
    def test_entailment_wins_majority(self, mock_nli):
        """
        3 out of 5 snippets support the claim → verdict = entailment.
        
        WHAT THE MOCK DOES:
          mock_nli.side_effect = [...] means "return these values in order".
          First call returns entailment, second returns entailment, etc.
        """
        # Simulate 5 NLI calls: 3 support, 1 contradicts, 1 neutral
        mock_nli.side_effect = [
            {"labels": ["supports the claim", "contradicts the claim", "unrelated to the claim"],
             "scores": [0.85, 0.10, 0.05]},
            {"labels": ["supports the claim", "unrelated to the claim", "contradicts the claim"],
             "scores": [0.78, 0.15, 0.07]},
            {"labels": ["supports the claim", "contradicts the claim", "unrelated to the claim"],
             "scores": [0.92, 0.05, 0.03]},
            {"labels": ["contradicts the claim", "supports the claim", "unrelated to the claim"],
             "scores": [0.70, 0.20, 0.10]},
            {"labels": ["unrelated to the claim", "supports the claim", "contradicts the claim"],
             "scores": [0.60, 0.25, 0.15]},
        ]

        snippets = [_make_snippet(f"Evidence snippet number {i} about GDP growth rates in India") 
                     for i in range(5)]
        
        result = asyncio.run(run_nli(claim="India's GDP grew 7.5% in 2024", snippets=snippets))
        
        assert result.verdict == "entailment"
        assert result.evidence_count == 5
        # Confidence should be average of the 3 entailment scores: (0.85+0.78+0.92)/3
        expected_conf = round((0.85 + 0.78 + 0.92) / 3, 4)
        assert result.confidence == expected_conf

    @patch("verifier.tier2_nli._run_nli_sync")
    def test_contradiction_wins_majority(self, mock_nli):
        """
        Majority of snippets contradict the claim → verdict = contradiction.
        """
        mock_nli.side_effect = [
            {"labels": ["contradicts the claim", "supports the claim", "unrelated to the claim"],
             "scores": [0.88, 0.08, 0.04]},
            {"labels": ["contradicts the claim", "unrelated to the claim", "supports the claim"],
             "scores": [0.75, 0.15, 0.10]},
            {"labels": ["supports the claim", "contradicts the claim", "unrelated to the claim"],
             "scores": [0.65, 0.20, 0.15]},
        ]

        snippets = [_make_snippet(f"Contradicting evidence {i} about inflation rates") 
                     for i in range(3)]
        
        result = asyncio.run(run_nli(claim="Inflation was 4%", snippets=snippets))
        
        assert result.verdict == "contradiction"
        assert result.evidence_count == 3

    @patch("verifier.tier2_nli._run_nli_sync")
    def test_single_snippet(self, mock_nli):
        """
        Only 1 snippet → that snippet's label becomes the verdict.
        No voting needed; confidence = that snippet's score.
        """
        mock_nli.return_value = {
            "labels": ["supports the claim", "contradicts the claim", "unrelated to the claim"],
            "scores": [0.91, 0.06, 0.03],
        }

        snippets = [_make_snippet("India's GDP growth exceeded expectations reaching 7.4 percent")]
        result = asyncio.run(run_nli(claim="GDP was 7.5%", snippets=snippets))
        
        assert result.verdict == "entailment"
        assert result.confidence == 0.91
        assert result.evidence_count == 1
        assert len(result.nli_results) == 1
        assert result.nli_results[0].label == "entailment"