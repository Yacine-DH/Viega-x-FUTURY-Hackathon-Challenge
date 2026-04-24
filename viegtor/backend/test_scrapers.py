"""
Run every scraper once and report what each finds.
Does NOT require the FastAPI server — calls scrape() directly, not run().

Usage:
    cd viegtor/backend
    python test_scrapers.py                    # all scrapers
    python test_scrapers.py eurlex news        # specific scrapers by keyword
"""
import asyncio
import logging
import os
import sys

logging.basicConfig(level=logging.WARNING, format="%(name)s: %(message)s")
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

WEBHOOK = "http://localhost:8000/webhook/ingest"  # not called — just satisfies __init__


async def run_scraper(label: str, scraper) -> tuple[str, list, str | None]:
    try:
        signals = await scraper.scrape()
        return label, signals, None
    except Exception as exc:
        return label, [], str(exc)


async def main(filter_names: list[str]) -> None:
    from scrapers.scraper_eurlex import EurLexScraper
    from scrapers.scraper_news import NewsScraper
    from scrapers.scraper_commodities import CommoditiesScraper
    from scrapers.scraper_ted_tenders import TedTendersScraper
    from scrapers.scraper_epo_patents import EpoPatentsScraper
    from scrapers.scraper_competitor_ir import CompetitorIRScraper
    from scrapers.scraper_competitor_patents import CompetitorPatentsScraper

    news_key = os.getenv("NEWS_API_KEY", "")
    te_key = os.getenv("TRADING_ECONOMICS_API_KEY", "")
    epo_id = os.getenv("EPO_CLIENT_ID", "")
    epo_secret = os.getenv("EPO_CLIENT_SECRET", "")
    ted_key = os.getenv("TED_API_KEY", "")

    all_scrapers = [
        ("eurlex",             EurLexScraper(WEBHOOK)),
        ("news",               NewsScraper(WEBHOOK, api_key=news_key)),
        ("commodities",        CommoditiesScraper(WEBHOOK, api_key=te_key)),
        ("ted_tenders",        TedTendersScraper(WEBHOOK, api_key=ted_key)),
        ("epo_patents",        EpoPatentsScraper(WEBHOOK, epo_id, epo_secret)),
        ("competitor_ir",      CompetitorIRScraper(WEBHOOK)),
        ("competitor_patents", CompetitorPatentsScraper(WEBHOOK)),
    ]

    scrapers = (
        [(l, s) for l, s in all_scrapers if any(f in l for f in filter_names)]
        if filter_names else all_scrapers
    )

    print(f"\nRunning {len(scrapers)} scraper(s)...\n" + "-" * 60)

    tasks = [run_scraper(label, scraper) for label, scraper in scrapers]
    results = await asyncio.gather(*tasks)

    total = 0
    for label, signals, error in results:
        if error:
            print(f"  FAIL   {label}")
            print(f"         ERROR: {error[:80]}")
        else:
            total += len(signals)
            mark = "OK" if signals else "OK(0)"
            print(f"  {mark:<6} {label:<25} {len(signals)} signals")
            for s in signals[:2]:
                print(f"         . {s.raw_text[:70]}")
            if len(signals) > 2:
                print(f"         ... {len(signals) - 2} more")
        print()

    print("-" * 60)
    print(f"Total signals collected: {total}\n")


if __name__ == "__main__":
    filters = sys.argv[1:]
    asyncio.run(main(filters))
