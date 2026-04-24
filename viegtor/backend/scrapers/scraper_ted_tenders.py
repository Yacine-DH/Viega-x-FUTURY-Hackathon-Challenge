"""TED (Tenders Electronic Daily) EU public tenders scraper — coefficient 0.8.

Requires a TED API key (TED_API_KEY in .env). Register free at:
https://developer.ted.europa.eu/

TED v2 (no-auth) endpoint returns empty bodies — v3 is the only stable option.
If TED_API_KEY is not set, the scraper skips cleanly with a single warning.
"""
import logging
from datetime import datetime, timezone

import httpx

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

TED_SEARCH_URL = "https://ted.europa.eu/api/v3.0/notices/search"

CPV_CODES = ["45330000", "44163000"]  # 45330000=plumbing works, 44163000=pipes & fittings

TED_NOTICE_BASE = "https://ted.europa.eu/udl?uri=TED:NOTICE:{nd}:TEXT:EN:HTML"


class TedTendersScraper(BaseScraper):
    source_name = "ted_tenders"
    source_weight = 0.8

    def __init__(self, webhook_url: str, api_key: str = "", max_age_hours: int = 72) -> None:
        super().__init__(webhook_url, max_age_hours)
        self._api_key = api_key

    async def scrape(self) -> list[RawSignal]:
        if not self._api_key:
            logger.warning("TED_API_KEY not set — skipping TED tenders scraper")
            return []
        signals: list[RawSignal] = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            for cpv in CPV_CODES:
                try:
                    items = await self._fetch_tenders(client, cpv)
                    signals.extend(items)
                except Exception:
                    logger.exception("TED API request failed for CPV=%s", cpv)

        logger.info("TED tenders: found %d fresh signals", len(signals))
        return signals

    async def _fetch_tenders(self, client: httpx.AsyncClient, cpv: str) -> list[RawSignal]:
        params = {
            "q": f"cpv={cpv}",
            "scope": 3,
            "fields": "ND,TI,DT,CY,TY",
            "page": 1,
            "pageSize": 20,
            "sortField": "publicationDate",
            "sortOrder": "desc",
            "reverseOrder": "false",
            "searchType": "advanced",
        }
        resp = await client.get(
            TED_SEARCH_URL,
            params=params,
            headers={"Authorization": f"Bearer {self._api_key}"},
        )
        resp.raise_for_status()

        notices = resp.json().get("results", [])
        signals: list[RawSignal] = []

        for notice in notices:
            nd: str = notice.get("ND", {}).get("value", "")
            title: str = notice.get("TI", {}).get("value", f"Tender {nd}")
            pub_date_raw: str = notice.get("DT", {}).get("value", "")
            country: str = notice.get("CY", {}).get("value", "EU")
            notice_type: str = notice.get("TY", {}).get("value", "")

            pub_date = self._parse_ted_date(pub_date_raw)
            if pub_date and not self._is_fresh(pub_date):
                continue

            url = TED_NOTICE_BASE.format(nd=nd) if nd else TED_SEARCH_URL
            raw_text = f"[EU Tender | CPV {cpv} | {country} | {notice_type}] {title}"

            signals.append(RawSignal(
                source=self.source_name,
                url=url,
                raw_text=raw_text,
                timestamp=pub_date or datetime.now(timezone.utc),
                source_weight=self.source_weight,
            ))

        return signals

    def _parse_ted_date(self, raw: str) -> datetime | None:
        if not raw:
            return None
        for fmt in ("%Y%m%d", "%Y-%m-%d", "%d/%m/%Y"):
            try:
                return datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
            except ValueError:
                continue
        return None
