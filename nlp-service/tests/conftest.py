"""
conftest.py — pytest fixtures shared across all test modules.

AUTOUSE FIXTURES DEFINED HERE:
  clear_verification_cache — Clears the in-process result cache before and after
  every test. Prevents the L1 cache in verdict_router.py from returning stale
  results across tests that share the same input text.

  WHY THIS MATTERS:
    route_verification() caches results by MD5(text). Tests like
    test_tier1_accurate_passes_fast_path and test_tier1_fast_path_false
    both use "GDP grew 7.5% in 2024". Without clearing, the first test's
    real result would be returned to subsequent tests that expect mocked
    behavior.
"""

import sys
import os
import pytest

# Make sure the nlp-service root is on sys.path so imports work correctly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture(autouse=True)
def clear_verification_cache():
    """
    Clear the verdict_router L1 result cache before and after every test.
    This fixture runs for ALL tests (autouse=True) automatically.
    """
    from verifier.verdict_router import _result_cache
    _result_cache.clear()
    yield
    _result_cache.clear()
