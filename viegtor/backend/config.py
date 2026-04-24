from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Google Cloud
    gcp_project_id: str
    gcp_location: str = "us-central1"
    firestore_database: str = "(default)"

    # Firestore collections
    raw_signals_collection: str = "raw_signals"
    strategic_signals_collection: str = "strategic_signals"
    tribunal_sessions_collection: str = "tribunal_sessions"
    system_config_collection: str = "system_config"

    # Vertex AI model IDs
    gemini_flash_model: str = "gemini-1.5-flash-001"
    gemini_pro_model: str = "gemini-1.5-pro-001"

    # External API keys
    news_api_key: str = ""
    trading_economics_api_key: str = ""
    firecrawl_api_key: str = ""
    epo_client_id: str = ""
    epo_client_secret: str = ""
    sec_api_key: str = ""
    ted_api_key: str = ""

    # Scheduler
    webhook_base_url: str = "http://localhost:8000"

    # Signal freshness window (hours)
    signal_max_age_hours: int = 72


@lru_cache
def get_settings() -> Settings:
    return Settings()
