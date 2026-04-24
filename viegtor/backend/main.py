import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from config import get_settings
from engine.vertex_client import init_vertex_ai
from routers import webhook, signals, chat, tribunal
from scheduler import setup_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    logger.info(
        "Viega Intelligent Compass starting (project=%s, location=%s)",
        settings.gcp_project_id,
        settings.gcp_location,
    )
    init_vertex_ai()
    scheduler = setup_scheduler(settings)
    scheduler.start()
    logger.info("Scraper scheduler started — %d jobs registered", len(scheduler.get_jobs()))
    yield
    scheduler.shutdown(wait=False)
    logger.info("Viega Intelligent Compass shutting down")


app = FastAPI(
    title="Viega Intelligent Compass",
    description="Strategic Intelligence Engine — BUILD / INVEST / ADJUST / IGNORE",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(webhook.router)
app.include_router(signals.router)
app.include_router(chat.router)
app.include_router(tribunal.router)


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
