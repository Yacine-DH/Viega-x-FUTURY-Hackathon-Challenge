"""NewsAPI geopolitical & tariff alerts scraper — coefficient 0.7.

Uses strict boolean keyword queries to avoid hallucination-prone broad searches.
Falls back gracefully if NEWS_API_KEY is not set.

Fallback: add to SCRAPER_FALLBACKS.md and switch to Event Registry API.
"""
import logging
from datetime import datetime, timezone, timedelta

import httpx

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

NEWSAPI_URL = "https://newsapi.org/v2/everything"

# Strict boolean queries targeting relevant market signals only
QUERY_GROUPS = [
    {
        "q": '"building materials" AND (tariff OR "supply chain" OR regulation)',
        "label": "Building Materials Policy",
    },
    {
        "q": "copper AND (\"supply chain disruption\" OR tariff OR shortage)",
        "label": "Copper Supply Chain",
    },
    {
        "q": '"European construction" AND (tax OR regulation OR "energy standard")',
        "label": "EU Construction Regulation",
    },
    {
        "q": '"press fitting" OR "push-fit" OR "press system" AND (launch OR patent OR competitor)',
        "label": "Press Fitting Market",
    },
]


class NewsScraper(BaseScraper):
    source_name = "news_geopolitical"
    source_weight = 0.7

    def __init__(self, webhook_url: str, api_key: str = "", max_age_hours: int = 72) -> None:
        super().__init__(webhook_url, max_age_hours)
        self._api_key = api_key

    async def scrape(self) -> list[RawSignal]:
        if not self._api_key:
            logger.warning("NEWS_API_KEY not set — skipping news scraper")
            return []

        signals: list[RawSignal] = []
        from_date = (datetime.now(timezone.utc) - timedelta(hours=self.max_age_hours)).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )

        async with httpx.AsyncClient(timeout=20.0) as client:
            for group in QUERY_GROUPS:
                try:
                    items = await self._fetch_articles(client, group["q"], group["label"], from_date)
                    signals.extend(items)
                except Exception:
                    logger.exception("NewsAPI request failed for query: %s", group["q"])

        logger.info("NewsAPI: found %d signals", len(signals))
        return signals

    async def _fetch_articles(
        self,
        client: httpx.AsyncClient,
        query: str,
        label: str,
        from_date: str,
    ) -> list[RawSignal]:
        resp = await client.get(
            NEWSAPI_URL,
            params={
                "q": query,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 10,
                "from": from_date,
                "apiKey": self._api_key,
            },
        )
        resp.raise_for_status()

        articles = resp.json().get("articles", [])
        signals: list[RawSignal] = []

        for article in articles:
            pub_raw: str = article.get("publishedAt", "")
            title: str = article.get("title") or ""
            description: str = article.get("description") or ""
            url: str = article.get("url") or NEWSAPI_URL
            source_name: str = article.get("source", {}).get("name", "Unknown")

            if not title:
                continue

            try:
                pub_date = datetime.fromisoformat(pub_raw.rstrip("Z")).replace(tzinfo=timezone.utc)
            except ValueError:
                pub_date = datetime.now(timezone.utc)

            if not self._is_fresh(pub_date):
                continue

            raw_text = f"[{label} | {source_name}] {title}\n{description}"
            signals.append(RawSignal(
                source=self.source_name,
                url=url,
                raw_text=raw_text,
                timestamp=pub_date,
                source_weight=self.source_weight,
            ))

        return signals
