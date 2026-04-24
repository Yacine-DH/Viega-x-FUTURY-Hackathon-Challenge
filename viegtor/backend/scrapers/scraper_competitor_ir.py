"""Competitor IR & PR scraper — coefficient 1.0.

Uses Google News RSS with per-competitor boolean queries to collect press releases,
financial results, and product announcements — no Playwright selector fragility.

Why switched from Playwright:
  Each competitor site uses a different React/CMS structure. Selectors broke
  silently and the a[href] fallback flooded output with navigation links.
  Google News RSS is stable, structured, and requires no authentication.

Competitors monitored: Geberit, Aalberts, Aliaxis, NIBCO, TECE, SCHELL, Conex Banninger.
"""
import asyncio
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import quote

import feedparser

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

COMPETITOR_QUERIES = [
    {
        "label": "Geberit IR",
        "query": '"Geberit" AND ("press release" OR "results" OR "acquisition" OR "product launch" OR "expansion")',
    },
    {
        "label": "Aalberts IR",
        "query": '"Aalberts" AND ("press release" OR "results" OR "acquisition" OR "divestment" OR "product")',
    },
    {
        "label": "Aliaxis IR",
        "query": '"Aliaxis" AND ("press release" OR "results" OR "acquisition" OR "product" OR "market")',
    },
    {
        "label": "NIBCO IR",
        "query": '"NIBCO" AND ("press release" OR "product" OR "market" OR "expansion" OR "acquisition")',
    },
    {
        "label": "TECE IR",
        "query": '"TECE" AND ("plumbing" OR "fitting" OR "product" OR "press release" OR "market")',
    },
    {
        "label": "SCHELL IR",
        "query": '"SCHELL" AND ("fittings" OR "press release" OR "product" OR "market" OR "water")',
    },
    {
        "label": "Conex Banninger IR",
        "query": '"Conex" AND ("Banninger" OR "Bänninger") AND ("press release" OR "product" OR "fitting")',
    },
]


class CompetitorIRScraper(BaseScraper):
    source_name = "competitor_ir"
    source_weight = 1.0

    def __init__(self, webhook_url: str, max_age_hours: int = 72) -> None:
        # Competitor news is relevant for a full week
        super().__init__(webhook_url, max_age_hours=max(max_age_hours, 168))

    async def scrape(self) -> list[RawSignal]:
        signals: list[RawSignal] = []
        loop = asyncio.get_event_loop()

        for item in COMPETITOR_QUERIES:
            try:
                rss_url = GOOGLE_NEWS_RSS.format(query=quote(item["query"]))
                feed = await loop.run_in_executor(None, feedparser.parse, rss_url)
                batch = self._parse_feed(feed, item["label"])
                signals.extend(batch)
                logger.debug("competitor_ir [%s]: %d signals", item["label"], len(batch))
            except Exception:
                logger.exception("Google News RSS failed for %s", item["label"])

        logger.info("competitor_ir: %d total signals", len(signals))
        return signals

    def _parse_feed(self, feed, label: str) -> list[RawSignal]:
        signals: list[RawSignal] = []

        for entry in feed.entries[:10]:
            title: str = entry.get("title", "").strip()
            link: str = entry.get("link", "")
            summary: str = entry.get("summary", "").strip()

            if not title or not link:
                continue

            pub_date = self._parse_entry_date(entry)
            if pub_date and not self._is_fresh(pub_date):
                continue

            raw_text = f"[{label}] {title}"
            if summary:
                raw_text += f"\n{summary[:300]}"

            signals.append(RawSignal(
                source=self.source_name,
                url=link,
                raw_text=raw_text,
                timestamp=pub_date or datetime.now(timezone.utc),
                source_weight=self.source_weight,
            ))

        return signals

    def _parse_entry_date(self, entry: dict) -> datetime | None:
        for key in ("published", "updated"):
            raw = entry.get(key)
            if raw:
                try:
                    return parsedate_to_datetime(raw).replace(tzinfo=timezone.utc)
                except Exception:
                    pass
        return None
