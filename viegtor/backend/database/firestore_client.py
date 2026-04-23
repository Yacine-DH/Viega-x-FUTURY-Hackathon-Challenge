"""Firestore async client singleton.

Call get_firestore_client() anywhere in the database layer.
The client is created once and reused across requests.
Authentication uses Application Default Credentials (ADC) —
run `gcloud auth application-default login` locally or deploy
with a service account that has Firestore access.
"""
import logging
from functools import lru_cache

from google.cloud import firestore

from config import get_settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_firestore_client() -> firestore.AsyncClient:
    settings = get_settings()
    client = firestore.AsyncClient(
        project=settings.gcp_project_id,
        database=settings.firestore_database,
    )
    logger.info(
        "Firestore AsyncClient created (project=%s, database=%s)",
        settings.gcp_project_id,
        settings.firestore_database,
    )
    return client
