"""verifier package

Tiered Retrieval-Augmented Verification (RAV) engine.

This package is intentionally dependency-light for Tier 1 (numeric verification).
Other tiers (NLI / LLM) will be added in separate modules.
"""

from .tier1_numeric import (
    METRIC_TO_WORLD_BANK_INDICATOR,
    WorldBankNumericCheck,
    fetch_world_bank_series,
    tier1_numeric_check,
)

from .tier2_nli import (
    NliResult,
    Tier2Result,
    run_nli,
    # _run_nli_sync,   # Not exported since it's an internal helper for the async wrapper. Leading _ mean it's a private function not intended for external use.
)

from .tier3_llm import (
    EvidenceSummary,
    Tier3Result,
    tier3_llm_check,
)

from .evidence_fetcher import (
    EvidenceSnippet, 
    fetch_evidence,
    fetch_google_fact_checks,
    fetch_news_snippets,
)

from .verdict_router import (
    route_verification,
    VerificationResult,
    EvidenceItem,
)

__all__ = [
    "METRIC_TO_WORLD_BANK_INDICATOR",
    "WorldBankNumericCheck",
    "fetch_world_bank_series",
    "tier1_numeric_check",
    # Tier 2
    "EvidenceSnippet",
    "fetch_evidence",
    "fetch_google_fact_checks",
    "fetch_news_snippets",
    "NliResult",
    "Tier2Result",
    "run_nli",
    # Tier 3
    "EvidenceSummary",
    "Tier3Result",
    "tier3_llm_check",
    # Router
    "VerificationResult",
    "EvidenceItem",
    "route_verification",

]


