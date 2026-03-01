"""
This file has two responsibilities: sentence splitting and claim probability scoring.

Sentence splitter — split_into_sentences(text) → list[str]

Split on ., !, ? followed by whitespace/end, but skip abbreviations like Rs., Dr., Mr., No., vs., etc.. Returns a cleaned list of non-empty sentences.

Claim probability scoring — score_claim_probability(sentence) → float
Returns a number between 0 and 1 indicating how likely this sentence is to be a claim about an economic metric. Higher means more likely.
"""

import re

from metrics import get_all_metric_names   # to get the list of all the metrics we support, so we can check if any of them are mentioned in the sentence.

# Abbreviations that contain a dot but should NOT end a sentence
ABBREVIATIONS = [
    "rs", "dr", "mr", "mrs", "ms", "prof", "sr", "jr",
    "vs", "etc", "no", "vol", "jan", "feb", "mar", "apr",
    "jun", "jul", "aug", "sep", "oct", "nov", "dec",
    "govt", "dept", "est", "approx", "avg", "fig"
]


# split_into_sentences(text) — The Sentence Splitter


def split_into_sentences(text):

    # STEP A — protect abbreviations
    # Replace "Rs." → "Rs<DOT>" so the dot is invisible to the splitter
    protected = text
    for abbr in ABBREVIATIONS:
        # re.sub is case-insensitive here — matches "Rs.", "RS.", "rs."
        protected = re.sub(
            rf"\b{abbr}\.",          # word boundary + abbreviation + dot
            f"{abbr}<DOT>",          # replace with placeholder
            protected,
            flags=re.IGNORECASE
        )

    # STEP B — split on ". " or "! " or "? " or end of string
    # The pattern means: sentence-ending punctuation followed by
    # whitespace + capital letter (new sentence starts) OR end of string
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])$', protected)

    # STEP C — restore placeholders and clean up
    sentences = []
    for part in parts:
        restored = part.replace("<DOT>", ".")   # put the dots back
        cleaned = restored.strip()
        if cleaned:                              # skip empty strings
            sentences.append(cleaned)

    return sentences

# score_claim_probability(sentence) — The Claim Scorer
# This is a very simple heuristic model that checks if any known metric names are mentioned in the


def score_claim_probability(sentence):

    score = 0.0
    text_lower = sentence.lower()
    word_count = len(sentence.split())

    # ---- SIGNAL 1: Has a numeric value or percentage (+0.30) ----
    # Matches: "7.5%", "8 percent", "1,40,000", "$650 billion"
    has_number = bool(re.search(
        r'\d+(?:\.\d+)?\s*(?:%|percent|per\s+cent|billion|million|crore|lakh)?',
        text_lower
    ))
    if has_number:
        score += 0.30

    # ---- SIGNAL 2: Has a year (+0.20) ----
    # Matches: 1947, 2023, 2024. Word boundaries prevent matching inside larger numbers.
    has_year = bool(re.search(r'\b(?:19|20)\d{2}\b', sentence))
    if has_year:
        score += 0.20

    # ---- SIGNAL 3: Mentions a known metric (+0.25) ----
    # Uses the same metric names from metrics.py — stays in sync automatically
    metric_keywords = [name.lower() for name in get_all_metric_names()]
    # Also add common short-form keywords that appear in claims
    metric_keywords += ["gdp", "inflation", "unemployment", "deficit",
                        "literacy", "population", "forex", "poverty",
                        "per capita", "current account", "fiscal"]

    has_metric = any(keyword in text_lower for keyword in metric_keywords)
    if has_metric:
        score += 0.25

    # ---- SIGNAL 4: Has an assertion verb (+0.15) ----
    # These verbs signal that someone is making a factual claim, not asking or explaining
    claim_verbs = [
        "was", "is", "were", "stood at", "reached", "grew", "fallen",
        "fell", "rose", "dropped", "increased", "decreased", "surged",
        "declined", "crossed", "narrowed", "hit", "climbed", "slipped",
        "jumped", "contracted", "expanded", "touched", "recorded"
    ]
    has_verb = any(re.search(rf'\b{re.escape(verb)}\b', text_lower) for verb in claim_verbs)
    if has_verb:
        score += 0.15

    # ---- SIGNAL 5: Has a named subject (+0.05) ----
    # A claim needs a subject — who/what is the claim about?
    named_subjects = [
        "india", "rbi", "government", "ministry", "central bank",
        "pm", "prime minister", "finance minister", "niti aayog",
        "world bank", "imf", "united nations", "census"
    ]
    has_subject = any(subject in text_lower for subject in named_subjects)
    if has_subject:
        score += 0.05

    # ---- SIGNAL 6: Ideal sentence length (+0.05) ----
    if 8 <= word_count <= 50:
        score += 0.05

    # ---- PENALTY 1: Too short (−0.20) ----
    # A 3-word sentence can't be a verifiable claim
    if word_count < 4:
        score -= 0.20

    # ---- PENALTY 2: Too long (−0.10) ----
    # Very long sentences are usually explanations or run-ons, not factual claims
    if word_count > 70:
        score -= 0.10

    # ---- CLAMP to [0.0, 1.0] ----
    # Scores can't go below 0 or above 1
    return round(max(0.0, min(1.0, score)), 2)