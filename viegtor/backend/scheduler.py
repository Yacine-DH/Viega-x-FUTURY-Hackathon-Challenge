"""APScheduler cron wiring — triggers all scrapers every 3 days.

Instantiate with setup_scheduler(settings) and call scheduler.start()
inside the FastAPI lifespan. Each scraper runs independently; a failure
in one does not cancel the others.
"""
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from config import Settings
from scrapers.scraper_epo_patents import EpoPatentsScraper
from scrapers.scraper_eurlex import EurLexScraper
from scrapers.scraper_competitor_ir import CompetitorIRScraper
from scrapers.scraper_ted_tenders import TedTendersScraper
from scrapers.scraper_commodities import CommoditiesScraper
from scrapers.scraper_news import NewsScraper

logger = logging.getLogger(__name__)

# Cron interval: every 3 days (matches the 72-hour freshness window)
SCRAPE_INTERVAL_DAYS = 3


def setup_scheduler(settings: Settings) -> AsyncIOScheduler:
    webhook_url = f"{settings.webhook_base_url}/webhook/ingest"
    max_age = settings.signal_max_age_hours

    scrapers = [
        EpoPatentsScraper(
            webhook_url=webhook_url,
            epo_client_id=settings.epo_client_id,
            epo_client_secret=settings.epo_client_secret,
            max_age_hours=max_age,
        ),
        EurLexScraper(webhook_url=webhook_url, max_age_hours=max_age),
        CompetitorIRScraper(webhook_url=webhook_url, max_age_hours=max_age),
        TedTendersScraper(webhook_url=webhook_url, max_age_hours=max_age),
        CommoditiesScraper(
            webhook_url=webhook_url,
            api_key=settings.trading_economics_api_key,
            max_age_hours=max_age,
        ),
        NewsScraper(
            webhook_url=webhook_url,
            api_key=settings.news_api_key,
            max_age_hours=max_age,
        ),
    ]

    scheduler = AsyncIOScheduler()
    trigger = IntervalTrigger(days=SCRAPE_INTERVAL_DAYS)

    for scraper in scrapers:
        scheduler.add_job(
            scraper.run,
            trigger=trigger,
            id=scraper.source_name,
            name=f"Scraper: {scraper.source_name}",
            replace_existing=True,
            misfire_grace_time=3600,  # allow up to 1h late start
        )
        logger.info("Registered scraper job: %s (every %d days)", scraper.source_name, SCRAPE_INTERVAL_DAYS)

    return scheduler


async def run_all_scrapers_once(settings: Settings) -> dict[str, int]:
    """Utility: run every scraper immediately once (useful for manual trigger / testing)."""
    webhook_url = f"{settings.webhook_base_url}/webhook/ingest"
    max_age = settings.signal_max_age_hours

    scrapers = [
        EpoPatentsScraper(webhook_url, settings.epo_client_id, settings.epo_client_secret, max_age),
        EurLexScraper(webhook_url, max_age),
        CompetitorIRScraper(webhook_url, max_age),
        TedTendersScraper(webhook_url, max_age),
        CommoditiesScraper(webhook_url, settings.trading_economics_api_key, max_age),
        NewsScraper(webhook_url, settings.news_api_key, max_age),
    ]

    results: dict[str, int] = {}
    for scraper in scrapers:
        results[scraper.source_name] = await scraper.run()
    return results
