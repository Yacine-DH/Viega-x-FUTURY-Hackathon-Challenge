"""EUR-Lex regulation scraper — coefficient 1.0.

Parses the EUR-Lex RSS feed for recent EU directives and filters by keywords
relevant to building materials and water quality. feedparser is synchronous,
so it runs in a thread executor to avoid blocking the event loop.
"""
import asyncio
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

EURLEX_RSS_URLS = [
    # Recent EU directives
    "https://eur-lex.europa.eu/tools/rss.do?type=recent&maxResults=20&lang=en&typeOfActStatus=directive",
    # Recent EU regulations
    "https://eur-lex.europa.eu/tools/rss.do?type=recent&maxResults=20&lang=en&typeOfActStatus=regulation",
]

KEYWORDS = [
    "building material",
    "water quality",
    "drinking water",
    "plumbing",
    "sanitary",
    "copper",
    "construction product",
    "energy performance",
    "green building",
    "circular economy",
]


class EurLexScraper(BaseScraper):
    source_name = "eurlex_regulations"
    source_weight = 1.0

    async def scrape(self) -> list[RawSignal]:
        signals: list[RawSignal] = []
        loop = asyncio.get_event_loop()

        for rss_url in EURLEX_RSS_URLS:
            try:
                feed = await loop.run_in_executor(None, feedparser.parse, rss_url)
            except Exception:
                logger.exception("Failed to parse EUR-Lex RSS: %s", rss_url)
                continue

            for entry in feed.entries:
                title: str = entry.get("title", "")
                summary: str = entry.get("summary", "")
                link: str = entry.get("link", rss_url)
                pub_date = self._parse_date(entry)

                if pub_date and not self._is_fresh(pub_date):
                    continue

                combined = f"{title} {summary}".lower()
                if not any(kw in combined for kw in KEYWORDS):
                    continue

                signals.append(RawSignal(
                    source=self.source_name,
                    url=link,
                    raw_text=f"{title}\n\n{summary}",
                    timestamp=pub_date or datetime.now(timezone.utc),
                    source_weight=self.source_weight,
                ))

        logger.info("EUR-Lex: found %d relevant signals", len(signals))
        return signals

    def _parse_date(self, entry: dict) -> datetime | None:
        for key in ("published", "updated"):
            raw = entry.get(key)
            if raw:
                try:
                    return parsedate_to_datetime(raw).replace(tzinfo=timezone.utc)
                except Exception:
                    pass
        published_parsed = entry.get("published_parsed")
        if published_parsed:
            import time as _time
            return datetime.fromtimestamp(_time.mktime(published_parsed), tz=timezone.utc)
        return None
