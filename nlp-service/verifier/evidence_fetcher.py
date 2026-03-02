"""
evidence_fetcher.py — Tier 2 evidence retrieval

Fetches 3-5 evidence snippets from two sources:
  1. Google Fact Check Tools API — existing fact-checks (AFP, AltNews, Snopes, etc.)
  2. NewsAPI — recent news article snippets

These snippets are fed into tier2_nli.py for entailment/contradiction scoring.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta

import httpx
from dotenv import load_dotenv

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
GOOGLE_FACT_CHECK_API_KEY = os.getenv("GOOGLE_FACT_CHECK_API_KEY")

NEWSAPI_BASE = "https://newsapi.org/v2"
FACT_CHECK_BASE = "https://factchecktools.googleapis.com/v1alpha1"


@dataclass
class EvidenceSnippet:
    source: str
    title: str
    snippet: str
    url: str
    published_date: str | None
    evidence_type: str  # "fact_check" | "news"


class _TtlCache:
    def __init__(self, ttl: timedelta):
        self._ttl = ttl
        self._items: dict[str, tuple[datetime, list]] = {}

    def get(self, key: str) -> list | None:
        item = self._items.get(key)
        if item is None:
            return None
        created_at, value = item
        if datetime.utcnow() - created_at > self._ttl:
            self._items.pop(key, None)
            return None
        return value

    def set(self, key: str, value: list) -> None:
        self._items[key] = (datetime.utcnow(), value)


_evidence_cache = _TtlCache(ttl=timedelta(hours=2))


async def fetch_google_fact_checks(
    query: str,
    max_results: int = 3,
    timeout: float = 8.0,
) -> list[EvidenceSnippet]:
    """
    Search Google Fact Check Tools API for existing fact-checks matching the query.
    Returns AFP, AltNews, Snopes, Boom, FactChecker.in results.
    Free: no rate limit per day for reasonable use.
    """
    if not GOOGLE_FACT_CHECK_API_KEY:
        return []

    url = f"{FACT_CHECK_BASE}/claims:search"
    params = {
        "query": query,
        "key": GOOGLE_FACT_CHECK_API_KEY,
        "pageSize": max_results,
        "languageCode": "en",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError):
        return []

    snippets = []
    for claim in data.get("claims", []):
        text = claim.get("text", "")
        for review in claim.get("claimReview", []):
            snippets.append(EvidenceSnippet(
                source=review.get("publisher", {}).get("name", "Unknown"),
                title=review.get("title", text[:80]),
                snippet=f"{text} — Rated: {review.get('textualRating', 'N/A')}",
                url=review.get("url", ""),
                published_date=review.get("reviewDate"),
                evidence_type="fact_check",
            ))
            if len(snippets) >= max_results:
                break
        if len(snippets) >= max_results:
            break

    return snippets


async def fetch_news_snippets(
    query: str,
    max_results: int = 3,
    timeout: float = 8.0,
) -> list[EvidenceSnippet]:
    """
    Search NewsAPI for recent articles matching the query.
    Free tier: 100 requests/day.
    Uses /v2/everything with relevancy sort.
    """
    if not NEWS_API_KEY:
        return []

    url = f"{NEWSAPI_BASE}/everything"
    params = {
        "q": query,
        "apiKey": NEWS_API_KEY,
        "language": "en",
        "sortBy": "relevancy",
        "pageSize": max_results,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError):
        return []

    snippets = []
    for article in data.get("articles", [])[:max_results]:
        source_name = article.get("source", {}).get("name", "Unknown")
        title = article.get("title") or ""
        description = article.get("description") or ""
        snippet_text = description if description else title
        snippets.append(EvidenceSnippet(
            source=source_name,
            title=title,
            snippet=snippet_text,
            url=article.get("url", ""),
            published_date=article.get("publishedAt"),
            evidence_type="news",
        ))

    return snippets


async def fetch_evidence(
    metric: str | None,
    year: int | None,
    claimed_value: float | None,
    max_results_per_source: int = 3,
) -> list[EvidenceSnippet]:
    """
    Main entry point for Tier 2 evidence retrieval.
    Builds a smart query from the extracted claim fields and fetches
    from both Google Fact Check + NewsAPI.

    Returns combined list, fact-checks first (higher authority).
    Results are cached per query for 2 hours.
    """
    # Build a targeted search query
    parts = []
    if metric:
        parts.append(metric)
    if year:
        parts.append(str(year))
    if claimed_value is not None:
        parts.append(str(claimed_value))
    parts.append("India")  # context anchor for this MVP (India-focused claims)

    query = " ".join(parts)
    cache_key = f"evidence:{query}:{max_results_per_source}"

    cached = _evidence_cache.get(cache_key)
    if cached is not None:
        return cached

    # Fetch both sources concurrently
    import asyncio
    fact_checks, news = await asyncio.gather(
        fetch_google_fact_checks(query, max_results=max_results_per_source),
        fetch_news_snippets(query, max_results=max_results_per_source),
    )

    combined = fact_checks + news
    _evidence_cache.set(cache_key, combined)
    return combined