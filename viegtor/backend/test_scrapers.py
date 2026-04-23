import asyncio
from config import get_settings
from scheduler import run_all_scrapers_once

if __name__ == "__main__":
    print("Starting all scrapers manually...")
    asyncio.run(run_all_scrapers_once(get_settings()))
    print("Done!")
