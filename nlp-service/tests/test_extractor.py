"""
test_extractor.py — Automated tests for the NLP extraction pipeline
=====================================================================
Run with:  pytest tests/ -v        (from nlp-service/ directory)
           pytest tests/ -v --tb=short   (shorter error output)

WHY TESTS?
  Regex is fragile. A tiny pattern change can break something that worked before.
  Tests catch these "regressions" instantly. Every time you change extractor.py
  or metrics.py, run pytest to make sure nothing broke.

HOW PYTEST WORKS:
  1. pytest auto-discovers files named test_*.py
  2. Inside those files, it runs every function named test_*
  3. Each function uses "assert" statements — if any assert fails, the test fails
  4. assert <condition> is like: if not condition: raise AssertionError
"""

import sys
import os

# Add the parent directory to the Python path so we can import our modules.
# Without this, Python can't find extractor.py and metrics.py because they're
# one level up (in nlp-service/, not nlp-service/tests/).
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from extractor import extract_year, extract_value, extract_all
from metrics import find_metric, get_all_metric_names


# =============================================================================
# YEAR EXTRACTION TESTS
# =============================================================================

class TestExtractYear:
    """Group all year-related tests in one class."""

    def test_standard_year(self):
        """Basic 4-digit year in a sentence."""
        assert extract_year("GDP growth was 7.5% in 2024") == 2024

    def test_multiple_years_returns_last(self):
        """When multiple years present, return the last (most recent)."""
        assert extract_year("GDP grew from 6% in 2023 to 7.5% in 2024") == 2024

    def test_no_year_returns_none(self):
        """When no year is present, return None."""
        assert extract_year("Inflation is very high") is None

    def test_old_year(self):
        """Should recognize years starting with 19xx."""
        assert extract_year("India gained independence in 1947") == 1947

    def test_year_not_inside_larger_number(self):
        """Should NOT match 2024 inside PIN code 560024."""
        # 560024 doesn't contain a standalone 2024 — the regex word boundaries prevent this
        result = extract_year("PIN code 560024 has no year")
        # 560024 won't match \b(19|20)\d{2}\b because 2002 is embedded
        assert result is None or result != 560024

    def test_year_at_start_of_text(self):
        """Year at the very beginning of the string."""
        assert extract_year("2025 saw a rise in inflation") == 2025

    def test_year_at_end_of_text(self):
        """Year at the very end of the string."""
        assert extract_year("Inflation rose in 2025") == 2025


# =============================================================================
# VALUE EXTRACTION TESTS
# =============================================================================

class TestExtractValue:
    """Group all value-related tests in one class."""

    def test_percentage_with_symbol(self):
        """7.5% → 7.5"""
        assert extract_value("GDP growth was 7.5% in 2024") == 7.5

    def test_percentage_with_word(self):
        """8 percent → 8.0"""
        assert extract_value("Unemployment was 8 percent") == 8.0

    def test_percentage_with_two_words(self):
        """4.1 per cent → 4.1"""
        assert extract_value("Inflation was 4.1 per cent in 2023") == 4.1

    def test_negative_value(self):
        """-2.3% → -2.3"""
        assert extract_value("Growth was -2.3% this quarter") == -2.3

    def test_no_number_returns_none(self):
        """When no number present, return None."""
        assert extract_value("The economy is doing well") is None

    def test_indian_number_format(self):
        """1,72,000 → 172000.0 (Indian comma format)."""
        assert extract_value("Income is 1,72,000 rupees") == 172000.0

    def test_western_number_format(self):
        """100,000 → 100000.0 (Western comma format)."""
        assert extract_value("Salary is 100,000 dollars") == 100000.0

    def test_whole_number_percentage(self):
        """8% (no decimal) → 8.0"""
        assert extract_value("Rate is 8%") == 8.0

    def test_percentage_preferred_over_plain_number(self):
        """When text has both a percentage and another number, prefer the percentage."""
        result = extract_value("In 2024, GDP grew 7.5%")
        assert result == 7.5  # not 2024


# =============================================================================
# METRIC EXTRACTION TESTS
# =============================================================================

class TestFindMetric:
    """Group all metric-related tests in one class."""

    def test_gdp_growth_rate_strong(self):
        result = find_metric("India's GDP growth rate was 7.5%")
        assert result["metric"] == "GDP growth rate"
        assert result["confidence"] == 0.9

    def test_inflation_strong(self):
        result = find_metric("CPI inflation hit 6.2%")
        assert result["metric"] == "inflation rate"
        assert result["confidence"] == 0.9

    def test_unemployment_strong(self):
        result = find_metric("The unemployment rate rose to 8%")
        assert result["metric"] == "unemployment rate"
        assert result["confidence"] == 0.9

    def test_weak_match_lower_confidence(self):
        result = find_metric("Something about GDP numbers")
        assert result["metric"] == "GDP growth rate"
        assert result["confidence"] == 0.6

    def test_no_match_returns_none(self):
        result = find_metric("The weather is nice today")
        assert result["metric"] is None
        assert result["confidence"] == 0.0

    def test_fiscal_deficit(self):
        result = find_metric("Fiscal deficit was 3.4% of GDP")
        assert result["metric"] == "fiscal deficit"
        assert result["confidence"] == 0.9

    def test_case_insensitive(self):
        """Should match regardless of capitalization."""
        result = find_metric("gdp GROWTH Rate was high")
        assert result["metric"] == "GDP growth rate"

    def test_get_all_metric_names(self):
        """Utility function should return all 10 metric names."""
        names = get_all_metric_names()
        assert len(names) == 10
        assert "GDP growth rate" in names
        assert "inflation rate" in names


# =============================================================================
# FULL EXTRACTION PIPELINE TESTS (extract_all)
# =============================================================================

class TestExtractAll:
    """Test the complete extraction pipeline."""

    def test_complete_extraction(self):
        """All three fields extracted — highest confidence."""
        result = extract_all("India's GDP growth rate was 7.5% in 2024")
        assert result["metric"] == "GDP growth rate"
        assert result["value"] == 7.5
        assert result["year"] == 2024
        assert result["confidence"] == 0.9
        assert result["original_text"] == "India's GDP growth rate was 7.5% in 2024"

    def test_missing_year(self):
        """Metric + value but no year — lower confidence."""
        result = extract_all("Inflation rate is 6.2%")
        assert result["metric"] == "inflation rate"
        assert result["value"] == 6.2
        assert result["year"] is None
        assert result["confidence"] < 0.9  # reduced because missing year

    def test_nothing_extractable(self):
        """No metric, value, or year — zero confidence."""
        result = extract_all("Hello world")
        assert result["metric"] is None
        assert result["value"] is None
        assert result["year"] is None
        assert result["confidence"] == 0.0

    def test_negative_percentage(self):
        """Negative values should be extracted correctly."""
        result = extract_all("Fiscal deficit was -3.4 percent of GDP in 2024")
        assert result["metric"] == "fiscal deficit"
        assert result["value"] == -3.4
        assert result["year"] == 2024

    def test_multiple_years_takes_last(self):
        """When multiple years, take the last one."""
        result = extract_all("GDP grew from 6% in 2023 to 7.5% in 2024")
        assert result["year"] == 2024
        assert result["value"] == 6.0  # first percentage found

    def test_response_always_has_original_text(self):
        """original_text should always be included in the response."""
        text = "Random text here"
        result = extract_all(text)
        assert result["original_text"] == text
