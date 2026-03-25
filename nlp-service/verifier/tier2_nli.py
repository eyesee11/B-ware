"""
tier2_nli.py — Tier 2: Natural Language Inference over retrieved evidence

Takes a claim + list of EvidenceSnippets (from evidence_fetcher.py) and
runs a pre-trained NLI model to classify each snippet as:
  entailment | contradiction | neutral

Model used: facebook/bart-large-mnli
  - Runs entirely on CPU (no GPU or training needed)
  - Downloaded once from HuggingFace (~1.6GB), cached locally after that
  - No API key required

Upgrade path: swap MODEL_NAME to cross-encoder/nli-deberta-v3-large
for higher accuracy when needed.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from functools import lru_cache

from verifier.evidence_fetcher import EvidenceSnippet

logger = logging.getLogger("bware.nlp.tier2")


MODEL_NAME = "facebook/bart-large-mnli"
# To upgrade quality later, change to:
# MODEL_NAME = "cross-encoder/nli-deberta-v3-large"

NLI_LABELS = ["contradiction", "neutral", "entailment"]
# BART-MNLI returns scores in this order: contradiction, neutral, entailment


@dataclass
class NliResult:
    label: str          # "entailment" | "contradiction" | "neutral"
    score: float        # 0.0 → 1.0 confidence for the winning label
    snippet_source: str
    snippet_text: str


@dataclass
class Tier2Result:
    verdict: str                # "entailment" | "contradiction" | "neutral" | "insufficient_evidence"
    confidence: float           # average score of the winning label across all snippets
    nli_results: list[NliResult]
    evidence_count: int


@lru_cache(maxsize=1)
def _load_pipeline():
    """
    Load the NLI pipeline once and cache it in memory for the process lifetime.
    Called lazily on first use so server startup is not delayed.
    Downloads the model from HuggingFace on first run (~1.6GB).
    """
    from transformers import pipeline
    logger.info("Loading NLI model: %s  (first call only...)", MODEL_NAME)
    nli_pipeline = pipeline(
        "zero-shot-classification",
        model=MODEL_NAME,
        device=-1,  # -1 = CPU; change to 0 for GPU
    )
    logger.info("NLI model loaded and ready.")
    return nli_pipeline


def _run_nli_sync(claim: str, snippet: str) -> dict:
    """
    Run NLI synchronously (transformers pipeline is sync).
    Returns HuggingFace zero-shot classification result dict.
    """
    pipe = _load_pipeline()
    # We frame it as zero-shot: "does this text support/contradict/is unrelated to the claim?"
    result = pipe(
        snippet,
        candidate_labels=["supports the claim", "contradicts the claim", "unrelated to the claim"],
        hypothesis_template="This text {}.",
    )
    return result


def _map_label(raw_label: str) -> str:
    """Map zero-shot label back to canonical NLI label."""
    label_lower = raw_label.lower()
    if "supports" in label_lower:
        return "entailment"
    if "contradict" in label_lower:
        return "contradiction"
    return "neutral"


async def run_nli(
    claim: str,
    snippets: list[EvidenceSnippet],
) -> Tier2Result:
    """
    Run NLI model on each snippet vs the claim.
    Returns aggregated Tier2Result with majority verdict + confidence.

    Runs in a thread pool to avoid blocking the async event loop
    (transformers pipeline is CPU-bound sync code).
    """
    if not snippets:
        return Tier2Result(
            verdict="insufficient_evidence",
            confidence=0.0,
            nli_results=[],
            evidence_count=0,
        )

    loop = asyncio.get_running_loop()
    nli_results: list[NliResult] = []

    for snippet in snippets:
        text_to_score = snippet.snippet or snippet.title
        # Check the *snippet* field length specifically — not the fallback title.
        # An empty snippet ("") would otherwise fall through to the title
        # (e.g. "Article about ...") and produce garbage NLI scores.
        if not text_to_score or len((snippet.snippet or "").strip()) < 10:
            continue

        # Run blocking model call in thread pool
        raw = await loop.run_in_executor(
            None, _run_nli_sync, claim, text_to_score
        )

        top_label_raw = raw["labels"][0]
        top_score = raw["scores"][0]
        mapped = _map_label(top_label_raw)

        nli_results.append(NliResult(
            label=mapped,
            score=round(top_score, 4),
            snippet_source=snippet.source,
            snippet_text=text_to_score[:200],
        ))

    if not nli_results:
        return Tier2Result(
            verdict="insufficient_evidence",
            confidence=0.0,
            nli_results=[],
            evidence_count=0,
        )

    # Aggregate: count votes per label, confidence = avg score of winning label
    label_votes: dict[str, list[float]] = {
        "entailment": [],
        "contradiction": [],
        "neutral": [],
    }
    for r in nli_results:
        label_votes[r.label].append(r.score)

    # Pick winner by vote count; break ties by avg score
    winner = max(
        label_votes,
        key=lambda lbl: (len(label_votes[lbl]), sum(label_votes[lbl]))
    )
    winning_scores = label_votes[winner]
    avg_confidence = round(sum(winning_scores) / len(winning_scores), 4) if winning_scores else 0.0

    return Tier2Result(
        verdict=winner,
        confidence=avg_confidence,
        nli_results=nli_results,
        evidence_count=len(nli_results),
    )