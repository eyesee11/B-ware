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

__all__ = [
    "METRIC_TO_WORLD_BANK_INDICATOR",
    "WorldBankNumericCheck",
    "fetch_world_bank_series",
    "tier1_numeric_check",
]
