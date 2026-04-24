"""EUR-Lex regulation scraper — coefficient 1.0.

Scrapes the EUR-Lex Official Journal L-series and C-series daily views.
Collects ALL acts without keyword pre-filtering — relevance judgement is
delegated to the LLM zero-shot filter in Phase 2 of the pipeline.

EUR-Lex sits behind AWS CloudFront WAF that issues a 202 JS-challenge for all
non-browser requests. Playwright stealth solves the challenge automatically, but
the page needs ~12 s after domcontentloaded for the challenge JS to fire, set the
cookie, reload, and render content. Plain httpx / feedparser cannot solve it.

Retention window: 30 days (regulations stay relevant far longer than the default 72h).
"""
import logging
from datetime import datetime, timezone

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

# OJ L-series: binding regulations & directives.  C-series: communications & notices.
_OJ_VIEWS = [
    ("L-series", "https://eur-lex.europa.eu/oj/daily-view/L-series/default.html"),
    ("C-series", "https://eur-lex.europa.eu/oj/daily-view/C-series/default.html"),
]

_ACT_LINK_SELECTOR = 'a[href*="legal-content"], a[href*="uri=OJ"]'

# 12 s for WAF challenge JS to fire, set auth cookie, reload, and render results.
_WAF_SETTLE_MS = 12_000

# Regulations remain strategically relevant for weeks; override the default 72h window.
_RETENTION_DAYS = 30


class EurLexScraper(BaseScraper):
    source_name = "eurlex_regulations"
    source_weight = 1.0

    def __init__(self, webhook_url: str, _max_age_hours: int = _RETENTION_DAYS * 24) -> None:
        # Regulations stay relevant for 30 days regardless of the global freshness setting.
        super().__init__(webhook_url, max_age_hours=_RETENTION_DAYS * 24)

    async def scrape(self) -> list[RawSignal]:
        signals: list[RawSignal] = []

        for series_label, url in _OJ_VIEWS:
            try:
                batch = await self._scrape_oj_view(url)
                signals.extend(batch)
                logger.debug("EUR-Lex OJ %s: %d acts collected", series_label, len(batch))
            except Exception:
                logger.exception("EUR-Lex OJ %s scrape failed", series_label)

        logger.info("EUR-Lex: %d acts forwarded to ingest pipeline", len(signals))
        return signals

    async def _scrape_oj_view(self, view_url: str) -> list[RawSignal]:
        signals: list[RawSignal] = []

        async with self._stealth_page() as page:
            await page.goto(view_url, wait_until="domcontentloaded", timeout=45_000)
            await page.wait_for_timeout(_WAF_SETTLE_MS)

            act_elements = await page.query_selector_all(_ACT_LINK_SELECTOR)
            logger.debug("EUR-Lex: %d act elements on %s", len(act_elements), view_url)

            for el in act_elements:
                title = (await el.inner_text()).strip()
                href: str = await el.evaluate("e => e.href")

                if not title or not href or href == view_url:
                    continue

                signals.append(RawSignal(
                    source=self.source_name,
                    url=href,
                    raw_text=title,
                    timestamp=datetime.now(timezone.utc),
                    source_weight=self.source_weight,
                ))

        return signals
