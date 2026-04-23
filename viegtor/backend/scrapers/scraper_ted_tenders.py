"""TED (Tenders Electronic Daily) EU public tenders scraper — coefficient 0.8.

Uses the TED v2 REST API (no auth required) filtered to CPV code 45330000
(plumbing / sanitary installation work).

TED v3 API requires a registered key — fall back to v2 for hackathon speed.
"""
import logging
from datetime import datetime, timezone

import httpx

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

TED_SEARCH_URL = "https://ted.europa.eu/api/v2.0/notices/search"

# CPV 45330000 = Plumbing and sanitary works
# CPV 44100000 = Construction materials, fittings and supplies (broader)
CPV_CODES = ["45330000", "44163000"]  # 44163000 = pipes, tubes, fittings

TED_NOTICE_BASE = "https://ted.europa.eu/udl?uri=TED:NOTICE:{nd}:TEXT:EN:HTML"


class TedTendersScraper(BaseScraper):
    source_name = "ted_tenders"
    source_weight = 0.8

    async def scrape(self) -> list[RawSignal]:
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
        resp = await client.get(TED_SEARCH_URL, params=params)
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
