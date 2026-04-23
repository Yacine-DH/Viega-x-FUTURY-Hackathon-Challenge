import abc
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta

import httpx
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

from schemas.signals import RawSignal

logger = logging.getLogger(__name__)


class BaseScraper(abc.ABC):
    source_name: str = ""
    source_weight: float = 1.0

    def __init__(self, webhook_url: str, max_age_hours: int = 72) -> None:
        self.webhook_url = webhook_url
        self.max_age_hours = max_age_hours

    def _is_fresh(self, timestamp: datetime) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=self.max_age_hours)
        ts = timestamp.replace(tzinfo=timezone.utc) if timestamp.tzinfo is None else timestamp
        return ts >= cutoff

    @asynccontextmanager
    async def _stealth_page(self):
        """Yield a stealth-configured Playwright page. Apply stealth BEFORE navigation."""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await stealth_async(page)
                yield page
            finally:
                await browser.close()

    @abc.abstractmethod
    async def scrape(self) -> list[RawSignal]:
        ...

    async def run(self) -> int:
        """Scrape and POST each signal to the ingest webhook. Returns count of successfully sent signals."""
        try:
            signals = await self.scrape()
        except Exception:
            logger.exception("Scraper %s raised an unhandled error — skipping run", self.source_name)
            return 0

        if not signals:
            logger.info("%s: no fresh signals found", self.source_name)
            return 0

        sent = 0
        async with httpx.AsyncClient(timeout=60.0) as client:
            for signal in signals:
                try:
                    resp = await client.post(
                        self.webhook_url,
                        content=signal.model_dump_json(),
                        headers={"Content-Type": "application/json"},
                    )
                    resp.raise_for_status()
                    sent += 1
                except Exception:
                    logger.exception(
                        "Failed to POST signal to webhook (source=%s, url=%s)",
                        signal.source,
                        signal.url,
                    )

        logger.info("%s: %d/%d signals sent to webhook", self.source_name, sent, len(signals))
        return sent
