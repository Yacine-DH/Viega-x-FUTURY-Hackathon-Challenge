"""Competitor IR & PR scraper — coefficient 1.0.

EU competitors (Geberit, Aalberts, Aliaxis): Playwright stealth on their
investor-relations press release pages.
US competitor (NIBCO): SEC EDGAR free Atom feed (no API key required).

If Playwright is blocked: document in SCRAPER_FALLBACKS.md and switch to
Firecrawl or ZenRows.
"""
import asyncio
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

EU_COMPETITOR_PAGES = [
    {
        "name": "geberit",
        "url": "https://www.geberit.com/en/publications",
        "article_selector": "article, .news-item, .press-release, .media-release",
        "title_selector": "h2, h3, .title",
        "date_selector": "time, .date, [datetime]",
    },
    {
        "name": "aalberts",
        "url": "https://aalberts.com/newsroom",
        "article_selector": "article, .press-release-item, .news-list__item",
        "title_selector": "h2, h3, .press-release__title",
        "date_selector": "time, .date, .press-release__date",
    },
    {
        "name": "aliaxis",
        "url": "https://aliaxis.com/latest/",
        "article_selector": "article, .press-release, .news-card",
        "title_selector": "h2, h3, .card__title",
        "date_selector": "time, .date, .card__date",
    },
]

NIBCO_EDGAR_RSS = (
    "https://www.nibco.com/news-events/news/"
    "?action=getcompany&company=nibco&type=8-K"
    "&dateb=&owner=include&count=10&search_text=&output=atom"
)


class CompetitorIRScraper(BaseScraper):
    source_name = "competitor_ir"
    source_weight = 1.0

    async def scrape(self) -> list[RawSignal]:
        eu_signals = await self._scrape_eu_competitors()
        nibco_signals = await self._scrape_nibco_edgar()
        return eu_signals + nibco_signals

    async def _scrape_eu_competitors(self) -> list[RawSignal]:
        signals: list[RawSignal] = []
        for competitor in EU_COMPETITOR_PAGES:
            try:
                items = await self._scrape_ir_page(competitor)
                signals.extend(items)
            except Exception:
                logger.exception(
                    "Playwright scrape failed for %s — add to SCRAPER_FALLBACKS.md",
                    competitor["name"],
                )
        return signals

    async def _scrape_ir_page(self, competitor: dict) -> list[RawSignal]:
        signals: list[RawSignal] = []
        async with self._stealth_page() as page:
            await page.goto(competitor["url"], wait_until="domcontentloaded", timeout=30000)

            articles = await page.query_selector_all(competitor["article_selector"])
            if not articles:
                # Generic fallback: any element with a heading + link
                articles = await page.query_selector_all("a[href]")

            for article in articles[:20]:
                title_el = await article.query_selector(competitor["title_selector"])
                date_el = await article.query_selector(competitor["date_selector"])

                title = (await title_el.inner_text()).strip() if title_el else ""
                if not title:
                    title = (await article.inner_text()).strip()[:120]

                href = await article.get_attribute("href") or competitor["url"]
                if href.startswith("/"):
                    from urllib.parse import urlparse
                    base = urlparse(competitor["url"])
                    href = f"{base.scheme}://{base.netloc}{href}"

                pub_date = await self._parse_element_date(date_el)
                if pub_date and not self._is_fresh(pub_date):
                    continue

                if not title:
                    continue

                signals.append(RawSignal(
                    source=self.source_name,
                    url=href,
                    raw_text=f"[{competitor['name'].title()} IR] {title}",
                    timestamp=pub_date or datetime.now(timezone.utc),
                    source_weight=self.source_weight,
                ))

        return signals

    async def _parse_element_date(self, el) -> datetime | None:
        if el is None:
            return None
        # Try <time datetime="..."> attribute first
        dt_attr = await el.get_attribute("datetime")
        if dt_attr:
            try:
                return datetime.fromisoformat(dt_attr.rstrip("Z")).replace(tzinfo=timezone.utc)
            except ValueError:
                pass
        text = (await el.inner_text()).strip()
        try:
            return parsedate_to_datetime(text).replace(tzinfo=timezone.utc)
        except Exception:
            return None

    async def _scrape_nibco_edgar(self) -> list[RawSignal]:
        """Fetches NIBCO 8-K filings from SEC EDGAR free Atom feed (no key needed)."""
        signals: list[RawSignal] = []
        loop = asyncio.get_event_loop()
        try:
            feed = await loop.run_in_executor(None, feedparser.parse, NIBCO_EDGAR_RSS)
        except Exception:
            logger.exception("Failed to fetch NIBCO SEC EDGAR feed")
            return signals

        for entry in feed.entries:
            title: str = entry.get("title", "")
            link: str = entry.get("link", NIBCO_EDGAR_RSS)
            pub_date = self._parse_feed_date(entry)

            if pub_date and not self._is_fresh(pub_date):
                continue

            signals.append(RawSignal(
                source=self.source_name,
                url=link,
                raw_text=f"[NIBCO SEC 8-K] {title}",
                timestamp=pub_date or datetime.now(timezone.utc),
                source_weight=self.source_weight,
            ))

        return signals

    def _parse_feed_date(self, entry: dict) -> datetime | None:
        for key in ("published", "updated"):
            raw = entry.get(key)
            if raw:
                try:
                    return parsedate_to_datetime(raw).replace(tzinfo=timezone.utc)
                except Exception:
                    pass
        return None
