"""Tier 1 — Numeric verification via World Bank API.

Goal:
- Given (metric, claimed_value, year), fetch an official value and compute % error.

Notes:
- This module is designed to be usable without the Node backend.
- Caching is in-memory (per-process) to avoid repeated API hits.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

import httpx


WORLD_BANK_API_BASE = "https://api.worldbank.org/v2"
DEFAULT_COUNTRY = "IND"

# Matches the 10 supported metric names in nlp-service/metrics.py
METRIC_TO_WORLD_BANK_INDICATOR: dict[str, str] = {
    "GDP growth rate": "NY.GDP.MKTP.KD.ZG",
    "inflation rate": "FP.CPI.TOTL.ZG",
    "unemployment rate": "SL.UEM.TOTL.ZS",
    "fiscal deficit": "GC.BAL.CASH.GD.ZS",
    "literacy rate": "SE.ADT.LITR.ZS",
    "population": "SP.POP.TOTL",
    "per capita income": "NY.GDP.PCAP.CD",
    "poverty rate": "SI.POV.NAHC",
    "foreign exchange reserves": "FI.RES.TOTL.CD",
    "current account deficit": "BN.CAB.XOKA.GD.ZS",
}


@dataclass(frozen=True)
class WorldBankNumericCheck:
    official_value: float | None
    claimed_value: float | None
    percentage_error: float | None
    source: str | None
    indicator_code: str | None
    source_url: str | None
    year: int | None


class _TtlCache:
    def __init__(self, ttl: timedelta):
        self._ttl = ttl
        self._items: dict[str, tuple[datetime, Any]] = {}

    def get(self, key: str) -> Any | None:
        item = self._items.get(key)
        if item is None:
            return None
        created_at, value = item
        if datetime.utcnow() - created_at > self._ttl:
            self._items.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._items[key] = (datetime.utcnow(), value)


_series_cache = _TtlCache(ttl=timedelta(hours=6))
_value_cache = _TtlCache(ttl=timedelta(hours=6))


def _world_bank_source_url(indicator_code: str, country: str = DEFAULT_COUNTRY) -> str:
    # Human-friendly indicator landing page
    # Example: https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=IN
    country_code = "IN" if country.upper() == "IND" else country.upper()
    return f"https://data.worldbank.org/indicator/{indicator_code}?locations={country_code}"


def _percentage_error(claimed: float, official: float) -> float:
    if official == 0:
        return 0.0 if claimed == 0 else 100.0
    return abs((claimed - official) / official) * 100.0


async def fetch_world_bank_series(
    *,
    indicator_code: str,
    country: str = DEFAULT_COUNTRY,
    start_year: int,
    end_year: int,
    timeout_seconds: float = 10.0,
) -> dict[int, float]:
    """Fetch a year->value series for a World Bank indicator.

    World Bank API response shape is typically:
      [ {metadata...}, [ {"date": "2024", "value": 7.8, ...}, ... ] ]

    Returns only non-null numeric values.
    """

    cache_key = f"series:{country}:{indicator_code}:{start_year}:{end_year}"
    cached = _series_cache.get(cache_key)
    if cached is not None:
        return cached

    url = (
        f"{WORLD_BANK_API_BASE}/country/{country}/indicator/{indicator_code}"
        f"?format=json&per_page=200&date={start_year}:{end_year}"
    )

    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        payload = resp.json()

    if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
        _series_cache.set(cache_key, {})
        return {}

    series: dict[int, float] = {}
    for point in payload[1]:
        if not isinstance(point, dict):
            continue
        date_str = point.get("date")
        value = point.get("value")
        if value is None:
            continue
        try:
            year = int(date_str)
            series[year] = float(value)
        except (TypeError, ValueError):
            continue

    _series_cache.set(cache_key, series)
    return series


async def fetch_world_bank_value(
    *,
    indicator_code: str,
    year: int,
    country: str = DEFAULT_COUNTRY,
) -> float | None:
    cache_key = f"value:{country}:{indicator_code}:{year}"
    cached = _value_cache.get(cache_key)
    if cached is not None:
        return cached

    # Most efficient is to fetch just that year (date=YYYY:YYYY)
    series = await fetch_world_bank_series(
        indicator_code=indicator_code,
        country=country,
        start_year=year,
        end_year=year,
    )
    value = series.get(year)
    _value_cache.set(cache_key, value)
    return value


async def tier1_numeric_check(
    *,
    metric: str | None,
    claimed_value: float | None,
    year: int | None,
    country: str = DEFAULT_COUNTRY,
) -> WorldBankNumericCheck:
    """Tier-1 numeric check against World Bank official data."""

    if metric is None or claimed_value is None or year is None:
        return WorldBankNumericCheck(
            official_value=None,
            claimed_value=claimed_value,
            percentage_error=None,
            source=None,
            indicator_code=None,
            source_url=None,
            year=year,
        )

    indicator_code = METRIC_TO_WORLD_BANK_INDICATOR.get(metric)
    if indicator_code is None:
        return WorldBankNumericCheck(
            official_value=None,
            claimed_value=claimed_value,
            percentage_error=None,
            source=None,
            indicator_code=None,
            source_url=None,
            year=year,
        )

    try:
        official_value = await fetch_world_bank_value(
            indicator_code=indicator_code,
            year=year,
            country=country,
        )
    except (httpx.HTTPError, ValueError, TypeError):
        official_value = None

    if official_value is None:
        return WorldBankNumericCheck(
            official_value=None,
            claimed_value=claimed_value,
            percentage_error=None,
            source="World Bank",
            indicator_code=indicator_code,
            source_url=_world_bank_source_url(indicator_code, country=country),
            year=year,
        )

    return WorldBankNumericCheck(
        official_value=float(official_value),
        claimed_value=float(claimed_value),
        percentage_error=round(_percentage_error(float(claimed_value), float(official_value)), 2),
        source="World Bank",
        indicator_code=indicator_code,
        source_url=_world_bank_source_url(indicator_code, country=country),
        year=year,
    )
