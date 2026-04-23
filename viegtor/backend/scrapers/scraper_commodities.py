"""Commodities & raw materials scraper — coefficient 0.8.

Primary: Trading Economics API (copper + industrial polymers).
Fallback: Playwright stealth on LME website if TRADING_ECONOMICS_API_KEY is unset.

A significant price move (>2% in 3 days) is considered a fresh signal.
"""
import logging
from datetime import datetime, timezone

import httpx

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

TE_BASE_URL = "https://api.tradingeconomics.com/markets/commodity"
LME_COPPER_URL = "https://www.lme.com/Metals/Non-ferrous/LME-Copper"

COMMODITIES = [
    {"symbol": "copper", "label": "Copper"},
    {"symbol": "polypropylene", "label": "Industrial Polymers (Polypropylene)"},
]

# Minimum absolute % change to qualify as a signal worth reporting
PRICE_CHANGE_THRESHOLD = 1.5


class CommoditiesScraper(BaseScraper):
    source_name = "commodities"
    source_weight = 0.8

    def __init__(self, webhook_url: str, api_key: str = "", max_age_hours: int = 72) -> None:
        super().__init__(webhook_url, max_age_hours)
        self._api_key = api_key

    async def scrape(self) -> list[RawSignal]:
        if self._api_key:
            return await self._scrape_trading_economics()
        logger.warning("TRADING_ECONOMICS_API_KEY not set — falling back to LME Playwright scrape")
        return await self._scrape_lme_playwright()

    async def _scrape_trading_economics(self) -> list[RawSignal]:
        signals: list[RawSignal] = []
        async with httpx.AsyncClient(timeout=20.0) as client:
            for commodity in COMMODITIES:
                try:
                    resp = await client.get(
                        f"{TE_BASE_URL}/{commodity['symbol']}",
                        params={"c": self._api_key, "f": "json"},
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    items = data if isinstance(data, list) else [data]

                    for item in items:
                        signal = self._build_signal_from_te(item, commodity["label"])
                        if signal:
                            signals.append(signal)
                except Exception:
                    logger.exception("Trading Economics request failed for %s", commodity["symbol"])

        return signals

    def _build_signal_from_te(self, item: dict, label: str) -> RawSignal | None:
        price = item.get("Last") or item.get("Price")
        daily_pct = item.get("DailyPercentualChange") or item.get("PercentChange1D", 0.0)
        url = item.get("Url", TE_BASE_URL)

        if price is None:
            return None
        try:
            change = float(daily_pct)
        except (TypeError, ValueError):
            change = 0.0

        if abs(change) < PRICE_CHANGE_THRESHOLD:
            return None

        direction = "surged" if change > 0 else "dropped"
        raw_text = (
            f"[Commodity Signal] {label} {direction} {abs(change):.1f}% to {price}. "
            f"This may indicate supply chain pressure on Viega's raw material costs."
        )

        return RawSignal(
            source=self.source_name,
            url=f"https://tradingeconomics.com/{url}",
            raw_text=raw_text,
            timestamp=datetime.now(timezone.utc),
            source_weight=self.source_weight,
        )

    async def _scrape_lme_playwright(self) -> list[RawSignal]:
        """Playwright stealth fallback for LME copper daily close price."""
        signals: list[RawSignal] = []
        try:
            async with self._stealth_page() as page:
                await page.goto(LME_COPPER_URL, wait_until="domcontentloaded", timeout=30000)
                price_el = await page.query_selector(
                    ".price-value, .settlement-price, [data-field='settlement']"
                )
                price_text = (await price_el.inner_text()).strip() if price_el else "N/A"

                raw_text = (
                    f"[LME Copper Daily Close] Price: {price_text}. "
                    "Monitor for >1.5% moves as an indicator of raw material cost pressure."
                )
                signals.append(RawSignal(
                    source=self.source_name,
                    url=LME_COPPER_URL,
                    raw_text=raw_text,
                    timestamp=datetime.now(timezone.utc),
                    source_weight=self.source_weight,
                ))
        except Exception:
            logger.exception(
                "LME Playwright fallback failed — add to SCRAPER_FALLBACKS.md"
            )
        return signals
