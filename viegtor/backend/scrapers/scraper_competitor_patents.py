"""Competitor Patent News & IP Activity scraper — coefficient 0.8.

Uses Google News RSS feeds (no API key required) with strict boolean
search strings to find recent news about competitor patent filings,
IP activity, and R&D announcements.

Complements the EPO OPS scraper (scraper_epo_patents.py) which queries
the official patent database directly — this scraper captures secondary
reporting and press coverage about those same filings.

Fallback: document in SCRAPER_FALLBACKS.md and switch to NewsAPI
or Event Registry if Google News RSS is blocked.
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

GOOGLE_NEWS_RSS_BASE = "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

# Strict boolean queries per competitor — targeting IP and R&D signals only
PATENT_NEWS_QUERIES = [
    {
        "label": "Geberit IP",
        "query": '"Geberit" AND ("patent" OR "intellectual property" OR "R&D" OR "innovation")',
    },
    {
        "label": "Aalberts IP",
        "query": '"Aalberts" AND ("patent" OR "intellectual property" OR "technology" OR "R&D")',
    },
    {
        "label": "Aliaxis IP",
        "query": '"Aliaxis" AND ("patent" OR "intellectual property" OR "innovation" OR "R&D")',
    },
    {
        "label": "NIBCO IP",
        "query": '"NIBCO" AND ("patent" OR "intellectual property" OR "innovation")',
    },
    {
        "label": "TECE IP",
        "query": '"TECE" AND ("patent" OR "intellectual property" OR "R&D" OR "innovation")',
    },
    {
        "label": "Conex Banninger IP",
        "query": '"Conex" AND ("Banninger" OR "Bänninger") AND ("patent" OR "intellectual property" OR "R&D")',
    },
    {
        "label": "SCHELL IP",
        "query": '"SCHELL" AND ("patent" OR "intellectual property" OR "R&D" OR "fittings")',
    },
    {
        "label": "Press Fitting Patents",
        "query": '("press fitting" OR "press-fit" OR "push-fit") AND ("patent" OR "EP" OR "filing")',
    },
    {
        "label": "Plumbing IP Trends",
        "query": '("plumbing" OR "pipe fitting") AND ("patent" OR "intellectual property" OR "R&D")',
    },
]


class CompetitorPatentsScraper(BaseScraper):
    source_name = "competitor_patents_news"
    source_weight = 0.8

    def __init__(self, webhook_url: str, max_age_hours: int = 72) -> None:
        # Patent news cycle is weekly — 7-day window catches meaningful volume.
        super().__init__(webhook_url, max_age_hours=max(max_age_hours, 168))

    async def scrape(self) -> list[RawSignal]:
        signals: list[RawSignal] = []
        loop = asyncio.get_event_loop()

        for item in PATENT_NEWS_QUERIES:
            try:
                rss_url = GOOGLE_NEWS_RSS_BASE.format(query=quote(item["query"]))
                feed = await loop.run_in_executor(None, feedparser.parse, rss_url)
                items = self._parse_feed(feed, item["label"])
                signals.extend(items)
                logger.debug(
                    "competitor_patents_news: %d signals from query '%s'",
                    len(items),
                    item["label"],
                )
            except Exception:
                logger.exception(
                    "Failed to fetch Google News RSS for query: %s", item["label"]
                )

        logger.info(
            "competitor_patents_news: %d total signals collected across %d queries",
            len(signals),
            len(PATENT_NEWS_QUERIES),
        )
        return signals

    def _parse_feed(self, feed, label: str) -> list[RawSignal]:
        signals: list[RawSignal] = []

        for entry in feed.entries[:10]:  # cap at 10 per query to avoid flooding
            title: str = entry.get("title", "").strip()
            link: str = entry.get("link", "")
            summary: str = entry.get("summary", "").strip()

            if not title or not link:
                continue

            pub_date = self._parse_entry_date(entry)
            if pub_date and not self._is_fresh(pub_date):
                continue

            raw_text = f"[Competitor IP News | {label}] {title}"
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
