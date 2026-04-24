"""Commodities & raw materials scraper — coefficient 0.8.

Primary: Trading Economics API (copper + industrial polymers).
Fallback: Yahoo Finance JSON API for copper (HG=F futures) — no API key needed,
          returns structured JSON directly without Playwright or authentication.

Why Yahoo Finance instead of LME Playwright:
  LME.com CSS selectors (.price-value, .settlement-price) do not match the site's
  actual rendered HTML, consistently returning N/A. Yahoo Finance's unofficial
  chart endpoint is stable, unauthenticated, and returns structured JSON.
"""
import logging
from datetime import datetime, timezone

import httpx

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

TE_BASE_URL = "https://api.tradingeconomics.com/markets/commodity"
YAHOO_COPPER_URL = "https://query1.finance.yahoo.com/v8/finance/chart/HG=F"
YAHOO_COPPER_PAGE = "https://finance.yahoo.com/quote/HG%3DF/"

COMMODITIES = [
    {"symbol": "copper", "label": "Copper"},
    {"symbol": "polypropylene", "label": "Industrial Polymers (Polypropylene)"},
]

PRICE_CHANGE_THRESHOLD = 1.5  # minimum % move to qualify as a signal


class CommoditiesScraper(BaseScraper):
    source_name = "commodities"
    source_weight = 0.8

    def __init__(self, webhook_url: str, api_key: str = "", max_age_hours: int = 72) -> None:
        super().__init__(webhook_url, max_age_hours)
        self._api_key = api_key

    async def scrape(self) -> list[RawSignal]:
        if self._api_key:
            return await self._scrape_trading_economics()
        logger.warning("TRADING_ECONOMICS_API_KEY not set — falling back to Yahoo Finance")
        return await self._scrape_yahoo_finance()

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
        return RawSignal(
            source=self.source_name,
            url=f"https://tradingeconomics.com/{url}",
            raw_text=(
                f"[Commodity Signal] {label} {direction} {abs(change):.1f}% to {price}. "
                "This may indicate supply chain pressure on Viega's raw material costs."
            ),
            timestamp=datetime.now(timezone.utc),
            source_weight=self.source_weight,
        )

    async def _scrape_yahoo_finance(self) -> list[RawSignal]:
        """Fetch copper futures price from Yahoo Finance (no API key required)."""
        signals: list[RawSignal] = []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    YAHOO_COPPER_URL,
                    params={"interval": "1d", "range": "5d"},
                    headers={"User-Agent": "Mozilla/5.0 (compatible; ViegaCompass/1.0)"},
                )
                resp.raise_for_status()
                data = resp.json()

            result = data["chart"]["result"][0]
            meta = result["meta"]
            price = meta.get("regularMarketPrice")
            prev_close = meta.get("chartPreviousClose") or meta.get("previousClose")
            currency = meta.get("currency", "USD")

            if price is None or prev_close is None:
                logger.warning("Yahoo Finance: missing price data in response")
                return signals

            pct = ((price - prev_close) / prev_close) * 100
            logger.info("Yahoo Finance copper: %.2f %s (%.1f%% change)", price, currency, pct)

            if abs(pct) < PRICE_CHANGE_THRESHOLD:
                logger.info("Copper move %.1f%% below threshold %.1f%% — skipping", abs(pct), PRICE_CHANGE_THRESHOLD)
                return signals

            direction = "surged" if pct > 0 else "dropped"
            signals.append(RawSignal(
                source=self.source_name,
                url=YAHOO_COPPER_PAGE,
                raw_text=(
                    f"[Commodity Signal] Copper (HG=F) {direction} {abs(pct):.1f}% "
                    f"to {price:.2f} {currency}/lb. "
                    "This may indicate supply chain pressure on Viega's raw material costs."
                ),
                timestamp=datetime.now(timezone.utc),
                source_weight=self.source_weight,
            ))

        except Exception:
            logger.exception("Yahoo Finance copper fetch failed — add to SCRAPER_FALLBACKS.md")

        return signals
