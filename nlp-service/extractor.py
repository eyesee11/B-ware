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
import html
import unicodedata
from metrics import find_metric, PERCENTAGE_METRICS

# =============================================================================
# N-7: PRE-COMPILED REGEXES — built once at module load, not on every call
# =============================================================================
_RE_YEAR          = re.compile(r"\b((?:19|20)\d{2})\b")
# N-1: Fiscal year patterns
_RE_FY_FULL       = re.compile(r"\bFY\s?(\d{4})-(\d{2})\b", re.IGNORECASE)  # FY2024-25
_RE_FY_SHORT      = re.compile(r"\b(\d{4})-(\d{2})\b")                      # 2023-24

_RE_PERCENT_VAL   = re.compile(r"(-?\d+(?:,\d+)*(?:\.\d+)?)\s*(?:%|percent|per\s*cent)", re.IGNORECASE)
_RE_NUMBER        = re.compile(r"(?<!\d)(-?\d+(?:,\d+)*(?:\.\d+)?)(?!\d)")
_RE_YEAR_LIKE     = re.compile(r"^(?:19|20)\d{2}$")
_RE_PERCENT_NEAR  = re.compile(r"\d\s*(?:%|percent|per\s*cent)", re.IGNORECASE)

# N-2: Word-form number multipliers (longest phrases first to avoid partial hits)
# NOTE: lakh crore must come before lakh and crore individually.
# Non-raw strings used for the \u20b9 (\u20b9 = ₹) to be processed by Python.
_WORD_MULTIPLIERS = [
    (re.compile("(?:\u20b9|rs\\.?\\s*)?(\\d+(?:\\.\\d+)?)\\s*lakh\\s*crore",  re.IGNORECASE), 1e12),
    (re.compile("(?:\u20b9|rs\\.?\\s*)?(\\d+(?:\\.\\d+)?)\\s*lakh",           re.IGNORECASE), 1e5),
    (re.compile("(?:\u20b9|rs\\.?\\s*)?(\\d+(?:\\.\\d+)?)\\s*crore",          re.IGNORECASE), 1e7),
    (re.compile(r"(\d+(?:\.\d+)?)\s*trillion",                                  re.IGNORECASE), 1e12),
    (re.compile(r"(\d+(?:\.\d+)?)\s*billion",                                   re.IGNORECASE), 1e9),
    (re.compile(r"(\d+(?:\.\d+)?)\s*million",                                   re.IGNORECASE), 1e6),
    (re.compile(r"(\d+(?:\.\d+)?)\s*thousand",                                  re.IGNORECASE), 1e3),
]

# N-19: Country name → ISO 3166 alpha-3 (top 10 economies + India focus)
# Listed most-specific first — "united states" before "states"
_COUNTRY_PATTERNS = [
    (re.compile(r"\bindia(?:'s)?\b",                         re.IGNORECASE), "IND"),
    (re.compile(r"\bindian\b",                               re.IGNORECASE), "IND"),
    (re.compile(r"\b(?:united\s+states|usa|u\.s\.a\.)\b",   re.IGNORECASE), "USA"),
    (re.compile(r"\bUS\b"),                                                  "USA"),  # case-sensitive — avoids matching "us" in normal prose
    (re.compile(r"\bamerican?\b",                            re.IGNORECASE), "USA"),
    (re.compile(r"\b(?:united\s+kingdom|uk|u\.k\.)\b",      re.IGNORECASE), "GBR"),
    (re.compile(r"\b(?:britain|british)\b",                  re.IGNORECASE), "GBR"),
    (re.compile(r"\bchin(?:a|ese)\b",                        re.IGNORECASE), "CHN"),
    (re.compile(r"\bjapan(?:ese)?\b",                        re.IGNORECASE), "JPN"),
    (re.compile(r"\bgerman(?:y)?\b",                         re.IGNORECASE), "DEU"),
    (re.compile(r"\bfran(?:ce|ch)\b",                        re.IGNORECASE), "FRA"),
    (re.compile(r"\bbrazil(?:ian)?\b",                       re.IGNORECASE), "BRA"),
    (re.compile(r"\bcanad(?:a|ian)\b",                       re.IGNORECASE), "CAN"),
    (re.compile(r"\baustrali(?:a|an)\b",                     re.IGNORECASE), "AUS"),
    (re.compile(r"\b(?:south\s+)?kor(?:ea|ean)\b",          re.IGNORECASE), "KOR"),
]


def preprocess_claim(text: str) -> str:
    """
    Sanitize raw user input before extraction.
    Handles HTML tags, whitespace noise, zero-width Unicode chars, and encoding.

    Steps:
      1. HTML-unescape   — "&amp;" → "&",  "&lt;" → "<"
      2. Strip HTML tags — <b>foo</b> → foo
      3. Remove zero-width / BOM chars  (\u200b, \u200c, \u200d, \ufeff)
      4. NFC normalization — unify composed/decomposed Unicode forms
      5. Collapse whitespace — tabs, newlines, multiple spaces → single space
      6. Strip leading/trailing whitespace
    """
    # Step 1: HTML unescape (&amp; &lt; &gt; etc.)
    text = html.unescape(text)

    # Step 2: Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", text)

    # Step 3: Remove zero-width and BOM characters
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)

    # Step 4: Unicode NFC normalization (e.g. é as one codepoint, not e + combining accent)
    text = unicodedata.normalize("NFC", text)

    # Step 5 & 6: Collapse whitespace and strip
    text = re.sub(r"[\t\r\n]+", " ", text)   # newlines/tabs → space
    text = re.sub(r" {2,}", " ", text)         # multiple spaces → one
    text = text.strip()

    return text




# extract_year(text) — Find the year in a claim
def extract_year(text: str) -> int | None:
    """
    Extract the most relevant year from claim text.

    N-1: Handles fiscal year formats:
      - "FY2024-25" → 2025  (ending year of the fiscal year)
      - "2023-24"   → 2024  (short format, only when followed by nothing suspicious)
    Falls back to standard 4-digit year (most recent match).
    """
    # ---- Step 1: FY2024-25 style (“FY2024-25” → 2025) ----
    fy_match = _RE_FY_FULL.search(text)
    if fy_match:
        base_year = int(fy_match.group(1))  # e.g. 2024
        suffix    = int(fy_match.group(2))  # e.g. 25
        # Resolve ending year: base_century + suffix
        century = (base_year // 100) * 100
        ending  = century + suffix
        # Edge case: suffix wraps century (e.g. FY1999-00 → 2000)
        if ending < base_year:
            ending += 100
        return ending

    # ---- Step 2: 2023-24 style (only when no plain year found nearby) ----
    plain_years = _RE_YEAR.findall(text)
    if not plain_years:
        fy_short = _RE_FY_SHORT.search(text)
        if fy_short:
            base_year = int(fy_short.group(1))
            suffix    = int(fy_short.group(2))
            century   = (base_year // 100) * 100
            ending    = century + suffix
            if ending < base_year:
                ending += 100
            return ending

    # ---- Step 3: Standard 4-digit year (take the last one mentioned) ----
    if plain_years:
        return int(plain_years[-1])

    return None



def extract_value(text: str) -> float | None:
    """
    Extract the numeric value from a claim.
    Priority order:
      1. Percentage values  (“7.5%”, “8 percent”)
      2. N-2: Word-form multipliers  (“1.4 billion”, “₹2 lakh crore”)
      3. Plain numbers (fallback, skipping year-like values)
    """
    # ---- STEP 1: Percentage takes highest priority ----
    pct_match = _RE_PERCENT_VAL.search(text)
    if pct_match:
        return _clean_number(pct_match.group(1))

    # ---- STEP 2: N-2 word-form multipliers ----
    # Check longest patterns first (lakh crore before lakh/crore individually)
    for pattern, multiplier in _WORD_MULTIPLIERS:
        m = pattern.search(text)
        if m:
            base = float(m.group(1).replace(",", ""))
            return base * multiplier

    # ---- STEP 3: Plain numeric fallback ----
    all_numbers = _RE_NUMBER.findall(text)
    if not all_numbers:
        return None

    for num_str in all_numbers:
        if not _RE_YEAR_LIKE.match(num_str.replace(",", "")):
            return _clean_number(num_str)

    # All numbers looked like years — return first as fallback
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


def extract_country(text: str) -> str:
    """
    N-19: Extract the country being referenced and return its ISO 3166 alpha-3 code.
    Defaults to "IND" (India) if no country is found — B-ware is India-focused.

    Supported countries: India, USA, UK, China, Japan, Germany, France,
                         Brazil, Canada, Australia, South Korea.
    """
    for pattern, iso3 in _COUNTRY_PATTERNS:
        if pattern.search(text):
            return iso3
    return "IND"   # default — most B-ware claims are about India


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

def extract_all(text: str) -> dict:
    """
    Orchestrates all extractors and returns a unified result dict.
    This is the only function main.py endpoints call directly.
    """
    # Sanitize input before anything else runs
    text = preprocess_claim(text)

    # ---- STEP 1: Extract each field independently ----
    metric_result = find_metric(text)       # {"metric": ..., "confidence": ...}
    value         = extract_value(text)     # float | None
    year          = extract_year(text)      # int   | None
    country       = extract_country(text)   # ISO3 str  (N-19)

    # ---- STEP 2: N-20 — value_type: percentage vs absolute ----
    # Determined by metric type; presence of % symbol is a secondary signal.
    metric_name = metric_result["metric"]
    if metric_name in PERCENTAGE_METRICS:
        value_type = "percentage"
    elif _RE_PERCENT_NEAR.search(text):
        value_type = "percentage"
    else:
        value_type = "absolute"

    # ---- STEP 3: N-9 — Improved confidence formula ----
    # Weights: metric = 50%, value = 30%, year = 20%
    # All components scaled by metric_confidence so a weak metric match caps the score.
    metric_confidence = metric_result["confidence"]
    if metric_confidence == 0.0:
        overall_confidence = 0.0
    else:
        weight = 0.50  # metric is always present if confidence > 0
        if value is not None:
            weight += 0.30
        if year is not None:
            weight += 0.20
        overall_confidence = round(metric_confidence * weight, 2)

    # ---- STEP 4: Build and return the response ----
    return {
        "original_text": text,
        "metric":        metric_name,
        "value":         value,
        "year":          year,
        "country":       country,       # N-19
        "value_type":    value_type,    # N-20
        "confidence":    overall_confidence,
    }

if __name__ == "__main__":

    test_claims = [
        "India's GDP growth rate was 7.5% in 2024",
        "Inflation hit 6.2% last year",
        "The unemployment rate rose to 8% in 2023",
        "Something about random stuff with no numbers",
        "GDP grew from 6% in 2023 to 7.5% in 2024",
        "India's population reached 1.4 billion in 2025",         # N-2: billion
        "Fiscal deficit was -3.4 percent of GDP in FY2023-24",   # N-1: fiscal year
        "Per capita income is ₹1,72,000 in 2024",
        "US GDP growth rate stood at 2.5% in 2023",               # N-19: USA
        "China's forex reserves hit $3.2 trillion in 2024",       # N-2 + N-19: CHN
        "UK unemployment rate was 4.2% in FY2024-25",             # N-1 + N-19: GBR
    ]

    print("=" * 70)
    print("EXTRACTOR — FULL TEST RUN")
    print("=" * 70)

    for claim in test_claims:
        result = extract_all(claim)
        print(f"\nClaim: \"{claim}\"")
        print(f"  → Metric:      {result['metric']}")
        print(f"  → Value:       {result['value']}")
        print(f"  → Year:        {result['year']}")
        print(f"  → Country:     {result['country']}")
        print(f"  → Value type:  {result['value_type']}")
        print(f"  → Confidence:  {result['confidence']}")

    print("\n" + "=" * 70)