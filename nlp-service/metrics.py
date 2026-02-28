"""
This file answers one question: "What economic metric is this claim about?"
Example:
    Input:  "India's GDP growth rate was 7.5% in 2024"
    Output: {"metric": "GDP growth rate", "confidence": 0.9}
"""

import re 
METRIC_PATTERNS = [
    {
        "name": "GDP growth rate",
        "strong": [
            r"gdp\s+growth\s+rate",        # "GDP growth rate"
            r"rate\s+of\s+gdp\s+growth",    # "rate of GDP growth"  
            r"economic\s+growth\s+rate",     # "economic growth rate"
            r"gdp\s+grew",                  # "GDP grew by 7%"
            r"gdp\s+growth",                # "GDP growth was 7%"
        ],
        "weak": [
            r"\bgdp\b",                     # just "GDP" alone — ambiguous
        ]
    },
    {
        "name": "inflation rate",
        "strong": [
            r"inflation\s+rate",            # "inflation rate"
            r"rate\s+of\s+inflation",       # "rate of inflation"
            r"cpi\s+inflation",             # "CPI inflation"
            r"consumer\s+price\s+in",       # "consumer price index/inflation"
            r"retail\s+inflation",          # "retail inflation"
        ],
        "weak": [
            r"\binflation\b",              # just "inflation"
        ]
    },

    {
        "name": "unemployment rate",
        "strong": [
            r"unemployment\s+rate",         # "unemployment rate"
            r"jobless\s+rate",              # "jobless rate"
            r"rate\s+of\s+unemployment",    # "rate of unemployment"
        ],
        "weak": [
            r"\bunemployment\b",           # just "unemployment"
            r"\bjobless\b",                # just "jobless"
        ]
    },

    {
        "name": "fiscal deficit",
        "strong": [
            r"fiscal\s+deficit",            # "fiscal deficit"
            r"budget\s+deficit",            # "budget deficit"
            r"fiscal\s+gap",               # "fiscal gap"
        ],
        "weak": [
            r"\bdeficit\b",                # just "deficit" — could be trade deficit too
        ]
    },

    {
        "name": "literacy rate",
        "strong": [
            r"literacy\s+rate",             # "literacy rate"
            r"rate\s+of\s+literacy",        # "rate of literacy"
        ],
        "weak": [
            r"\bliteracy\b",               # just "literacy"
            r"\bliterate\b",               # "literate population"
        ]
    },

    {
        "name": "population",
        "strong": [
            r"population\s+of\s+india",     # "population of India"
            r"india.{0,15}population",      # "India's population"
            r"total\s+population",          # "total population"
        ],
        "weak": [
            r"\bpopulation\b",             # just "population"
        ]
    },

    {
        "name": "per capita income",
        "strong": [
            r"per\s+capita\s+income",       # "per capita income"
            r"income\s+per\s+capita",       # "income per capita"
            r"per\s+capita\s+gdp",          # "per capita GDP"
            r"gdp\s+per\s+capita",          # "GDP per capita"
            r"average\s+income",            # "average income"
        ],
        "weak": [
            r"per\s+capita",               # just "per capita" — could be anything
        ]
    },

    {
        "name": "poverty rate",
        "strong": [
            r"poverty\s+rate",              # "poverty rate"
            r"below\s+poverty\s+line",      # "below poverty line"
            r"bpl\s+(?:rate|percentage)",   # "BPL rate/percentage"
            r"rate\s+of\s+poverty",         # "rate of poverty"
        ],
        "weak": [
            r"\bpoverty\b",               # just "poverty"
            r"\bbpl\b",                    # just "BPL"
        ]
    },

    {
        "name": "foreign exchange reserves",
        "strong": [
            r"forex\s+reserves?",           # "forex reserve(s)"
            r"foreign\s+exchange\s+reserves?",  # "foreign exchange reserve(s)"
            r"fx\s+reserves?",              # "FX reserves"
            r"foreign\s+reserves?",         # "foreign reserves"
        ],
        "weak": [
            r"\bforex\b",                  # just "forex"
        ]
    },

    {
        "name": "current account deficit",
        "strong": [
            r"current\s+account\s+deficit", # "current account deficit"
            r"trade\s+deficit",             # "trade deficit"
            r"trade\s+gap",                # "trade gap"
            r"\bcad\b",                    # "CAD" abbreviation
        ],
        "weak": [
            r"trade\s+balance",            # "trade balance" — could be surplus too
        ]
    },
]


# find_metric(text) — The Matching Function 
# WHAT IT DOES: Takes a raw claim string and figures out which metric it's about.

def find_metric(text):

    text_lower = text.lower()
    # User might type "GDP", "gdp", "Gdp", or "gDp".
    # Instead of writing patterns for every capitalization,
    # we convert everything to lowercase ONCE and write patterns in lowercase.

    # FIRST PASS — check all strong patterns (high confidence)
    for metric in METRIC_PATTERNS:
        for pattern in metric["strong"]:
            if re.search(pattern, text_lower):
                return {
                    "metric": metric["name"],
                    "confidence": 0.9
                }

    # SECOND PASS — check all weak patterns (lower confidence)
    for metric in METRIC_PATTERNS:
        for pattern in metric["weak"]:
            if re.search(pattern, text_lower):
                return {
                    "metric": metric["name"],
                    "confidence": 0.6
                }

    # NOTHING MATCHED — we don't recognize this metric
    return {
        "metric": None,
        "confidence": 0.0
    }


# get_all_metric_names() — Utility function 
# WHAT IT DOES: Returns a list of all known metric names.
#   Useful for: API responses ("here are the metrics we support"),
#   and for the backend to validate against official_data_cache.

def get_all_metric_names():
    return [metric["name"] for metric in METRIC_PATTERNS]

if __name__ == "__main__":
    # This block ONLY runs when you execute this file directly:

    test_claims = [
        "India's GDP growth rate was 7.5% in 2024",
        "Inflation hit 6.2% last year",
        "The unemployment rate rose to 8%",
        "Something about random stuff",
        "Deficit reached 3.4% of GDP",
    ]

    print("=" * 60)
    print("METRIC FINDER — TEST RUN")
    print("=" * 60)

    for claim in test_claims:
        result = find_metric(claim)
        print(f"\nClaim: \"{claim}\"")
        print(f"  → Metric:     {result['metric']}")
        print(f"  → Confidence: {result['confidence']}")

    print(f"\n\nSupported metrics: {get_all_metric_names()}")