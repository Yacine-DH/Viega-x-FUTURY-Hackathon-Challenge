"""EPO Open Patent Services (OPS) scraper — coefficient 1.0.

Searches by competitor assignee name. Requires EPO OPS credentials
(EPO_CLIENT_ID / EPO_CLIENT_SECRET) from https://developers.epo.org/
"""
import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from scrapers.base_scraper import BaseScraper
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

EPO_AUTH_URL = "https://ops.epo.org/3.2/auth/accesstoken"
EPO_SEARCH_URL = "https://ops.epo.org/3.2/rest-services/published-data/search"
EPO_ESPACENET_URL = "https://worldwide.espacenet.com/patent/search?q=pa%3D%22{assignee}%22"

COMPETITOR_ASSIGNEES = [
    "Geberit International AG",
    "Aalberts Industries NV",
    "Aliaxis SA",
    "NIBCO Inc",
    "Conex Banninger",
    "TECE GmbH",
    "SCHELL GmbH",
]


class EpoPatentsScraper(BaseScraper):
    source_name = "epo_patents"
    source_weight = 1.0

    def __init__(
        self,
        webhook_url: str,
        epo_client_id: str,
        epo_client_secret: str,
        max_age_hours: int = 72,
    ) -> None:
        super().__init__(webhook_url, max_age_hours)
        self._client_id = epo_client_id
        self._client_secret = epo_client_secret
        self._access_token: str | None = None

    async def _get_token(self, client: httpx.AsyncClient) -> str:
        resp = await client.post(
            EPO_AUTH_URL,
            data={"grant_type": "client_credentials"},
            auth=(self._client_id, self._client_secret),
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    async def _search(self, client: httpx.AsyncClient, assignee: str) -> list[dict[str, Any]]:
        resp = await client.get(
            EPO_SEARCH_URL,
            params={"q": f'pa="{assignee}"', "Range": "1-10"},
            headers={
                "Authorization": f"Bearer {self._access_token}",
                "Accept": "application/json",
            },
        )
        if resp.status_code == 401:
            self._access_token = await self._get_token(client)
            return await self._search(client, assignee)
        resp.raise_for_status()
        result = (
            resp.json()
            .get("ops:world-patent-data", {})
            .get("ops:biblio-search", {})
            .get("ops:search-result", {})
            .get("exchange-documents", [])
        )
        return result if isinstance(result, list) else [result]

    def _extract_abstract(self, doc: dict[str, Any]) -> str:
        try:
            abstract = doc["exchange-document"]["abstract"]
            if isinstance(abstract, list):
                abstract = abstract[0]
            text = abstract["p"]
            return text["$"] if isinstance(text, dict) else str(text)
        except (KeyError, TypeError):
            return ""

    def _extract_pub_date(self, doc: dict[str, Any]) -> datetime | None:
        try:
            raw = doc["exchange-document"]["@date-publ"]  # e.g. "20240115"
            return datetime(int(raw[:4]), int(raw[4:6]), int(raw[6:8]), tzinfo=timezone.utc)
        except (KeyError, TypeError, ValueError):
            return None

    async def scrape(self) -> list[RawSignal]:
        if not self._client_id or not self._client_secret:
            logger.warning("EPO credentials not set — skipping EPO scraper")
            return []

        signals: list[RawSignal] = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                self._access_token = await self._get_token(client)
            except Exception:
                logger.exception("EPO OAuth failed — check EPO_CLIENT_ID / EPO_CLIENT_SECRET")
                return signals

            for assignee in COMPETITOR_ASSIGNEES:
                try:
                    docs = await self._search(client, assignee)
                    for doc in docs:
                        abstract = self._extract_abstract(doc)
                        if not abstract:
                            continue
                        pub_date = self._extract_pub_date(doc) or datetime.now(timezone.utc)
                        if not self._is_fresh(pub_date):
                            continue
                        signals.append(RawSignal(
                            source=self.source_name,
                            url=EPO_ESPACENET_URL.format(assignee=assignee.replace(" ", "+")),
                            raw_text=f"[Patent by {assignee}] {abstract}",
                            timestamp=pub_date,
                            source_weight=self.source_weight,
                        ))
                except Exception:
                    logger.exception("EPO search failed for assignee=%s", assignee)

        return signals
