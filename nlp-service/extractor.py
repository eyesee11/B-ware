"""
extractor.py — The Core Extraction Engine

It takes raw claim text and extracts three things:
  1. METRIC — what is being claimed about (via metrics.py)
  2. VALUE  — the numeric value being claimed
  3. YEAR   — what year the claim refers to

Example:
    Input:  "India's GDP growth rate was 7.5% in 2024"
    Output: {
        "metric": "GDP growth rate",
        "value": 7.5,
        "year": 2024,
        "confidence": 0.9
    }
"""

import re
from metrics import find_metric  

# extract_year(text) — Find the year in a claim
def extract_year(text):

    pattern = r"\b((?:19|20)\d{2})\b"
    # ---- WHY (?:19|20) instead of (19|20)? ----
    # re.findall() returns what's inside capturing groups ().
    # If we wrote (19|20)\d{2}, findall would return ["20", "20"] — just the prefix!
    # By making the inner group non-capturing (?:...) and wrapping the WHOLE thing
    # in a capturing group, findall returns ["2023", "2024"] — the full years.
    matches = re.findall(pattern, text)

    if not matches:
        return None
    return int(matches[-1])



def extract_value(text):
    """
    Extract the numeric value from a claim.
    Prioritizes percentages over plain numbers.
    
    Args:
        text (str): Raw claim text
    
    Returns:
        float or None: The extracted value, or None if no number found
    """

    text_lower = text.lower()

    # ---- STEP 1: Look for percentage values first ----
    # This pattern matches: 7.5%, -2.3%, 8 percent, 4.1 per cent
    percentage_pattern = r"(-?\d+(?:,\d+)*(?:\.\d+)?)\s*(?:%|percent|per\s*cent)"

    percentage_match = re.search(percentage_pattern, text_lower)

    if percentage_match:
        raw_value = percentage_match.group(1)

        return _clean_number(raw_value)

    number_pattern = r"(?<!\d)(-?\d+(?:,\d+)*(?:\.\d+)?)(?!\d)"

    all_numbers = re.findall(number_pattern, text)

    if not all_numbers:
        return None

    year_pattern = r"^(?:19|20)\d{2}$"

    for num_str in all_numbers:
        if not re.match(year_pattern, num_str.replace(",", "")):

            return _clean_number(num_str)

    # All numbers looked like years — return the first one as a fallback
    return _clean_number(all_numbers[0])


def _clean_number(raw):
    """
    Convert a raw number string to a float.
    Handles commas in both Western (1,000) and Indian (1,00,000) formats.
    
    Args:
        raw (str): A number string like "7.5", "1,00,000", "-2.3"
    
    Returns:
        float: The cleaned number
    """
    cleaned = raw.replace(",", "")

    return float(cleaned)
    # If the string isn't a valid number, it raises ValueError.
    # We don't need to handle that here because our regex already guaranteed
    # the string contains only digits, dots, and minus signs.


# extract_all(text) — The Orchestrator
# WHAT IT DOES:
#   Calls all three extractors and combines them into one response.
#   This is the ONLY function that main.py (the API) will call.
#   Think of it as the "public API" of this module.
#
# CONFIDENCE CALCULATION:
#   confidence = (fields_found / 3) × metric_confidence
#
#   Example 1: Found metric (0.9), value, year → (3/3) × 0.9 = 0.90
#   Example 2: Found metric (0.6), value, no year → (2/3) × 0.6 = 0.40
#   Example 3: Found nothing → 0.0
#
# WHY THIS FORMULA?
#   - "fields_found / 3" rewards completeness (all 3 fields = full score)
#   - "× metric_confidence" weights by how sure we are about the metric
#   - A weak metric match (0.6) with all fields still only gets 0.6 max
#   - Missing fields reduce confidence proportionally
# =============================================================================

def extract_all(text):

    # ---- STEP 1: Extract each field independently ----
    metric_result = find_metric(text)       # Returns {"metric": ..., "confidence": ...}
    value = extract_value(text)             # Returns float or None
    year = extract_year(text)               # Returns int or None

    # ---- STEP 2: Calculate overall confidence ----
    fields_found = 0
    if metric_result["metric"] is not None:
        fields_found += 1
    if value is not None:
        fields_found += 1
    if year is not None:
        fields_found += 1

    metric_confidence = metric_result["confidence"]  # 0.0, 0.6, or 0.9

    if fields_found == 0:
        overall_confidence = 0.0
    else:
        overall_confidence = round((fields_found / 3) * metric_confidence, 2)

    # ---- STEP 3: Build and return the response ----
    return {
        "original_text": text,
        "metric": metric_result["metric"],
        "value": value,
        "year": year,
        "confidence": overall_confidence
    }
    # ---- WHY INCLUDE original_text IN THE RESPONSE? ----
    # So the backend can store it alongside the extraction results.

if __name__ == "__main__":

    test_claims = [
        "India's GDP growth rate was 7.5% in 2024",
        "Inflation hit 6.2% last year",
        "The unemployment rate rose to 8% in 2023",
        "Something about random stuff with no numbers",
        "GDP grew from 6% in 2023 to 7.5% in 2024",
        "India's population reached 1.4 billion in 2025",
        "Fiscal deficit was -3.4 percent of GDP in 2024",
        "Per capita income is ₹1,72,000 in 2024",
    ]

    print("=" * 70)
    print("EXTRACTOR — FULL TEST RUN")
    print("=" * 70)

    for claim in test_claims:
        result = extract_all(claim)
        print(f"\nClaim: \"{claim}\"")
        print(f"  → Metric:     {result['metric']}")
        print(f"  → Value:      {result['value']}")
        print(f"  → Year:       {result['year']}")
        print(f"  → Confidence: {result['confidence']}")

    print("\n" + "=" * 70)