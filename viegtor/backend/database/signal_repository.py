"""Firestore data access layer — all DB operations live here.

Never call Firestore directly from routers or engine modules.
All functions are async. Collections match config constants.

Collections used:
  strategic_signals   — processed + classified signals
  tribunal_sessions   — tribunal debate logs
  system_config       — adjustable coefficients and thresholds

Default source weights (can be overridden by tribunal feedback):
  epo_patents / eurlex_regulations / competitor_ir  → 1.0
  ted_tenders / commodities                         → 0.8
  news_geopolitical                                 → 0.7
"""
import logging
from datetime import datetime, timezone

from google.cloud.firestore_v1.base_query import FieldFilter

from config import get_settings
from database.firestore_client import get_firestore_client
from schemas.decisions import DecisionType
from schemas.signals import StrategicSignal, TribunalResponse

logger = logging.getLogger(__name__)

_DEFAULT_SOURCE_WEIGHTS: dict[str, float] = {
    "epo_patents": 1.0,
    "eurlex_regulations": 1.0,
    "competitor_ir": 1.0,
    "ted_tenders": 0.8,
    "commodities": 0.8,
    "news_geopolitical": 0.7,
}


# ── Signals ────────────────────────────────────────────────────────────────

async def save_signal(signal: StrategicSignal) -> str:
    """Persist a StrategicSignal. Uses signal_id as the Firestore document ID."""
    client = get_firestore_client()
    settings = get_settings()
    data = signal.model_dump(mode="json")
    await client.collection(settings.strategic_signals_collection).document(signal.signal_id).set(data)
    logger.info("Saved signal (id=%s, decision=%s)", signal.signal_id, signal.decision)
    return signal.signal_id


async def get_signal_by_id(signal_id: str) -> StrategicSignal | None:
    """Fetch a single signal by its ID. Returns None if not found."""
    client = get_firestore_client()
    settings = get_settings()
    doc = await client.collection(settings.strategic_signals_collection).document(signal_id).get()
    if not doc.exists:
        return None
    return StrategicSignal.model_validate(doc.to_dict())


async def get_signals(limit: int = 50) -> list[StrategicSignal]:
    """Return the most recent signals ordered by created_at descending."""
    client = get_firestore_client()
    settings = get_settings()
    docs = await (
        client.collection(settings.strategic_signals_collection)
        .order_by("created_at", direction="DESCENDING")
        .limit(limit)
        .get()
    )
    return [StrategicSignal.model_validate(d.to_dict()) for d in docs]


async def get_signals_by_decision(
    decision: DecisionType, limit: int = 50
) -> list[StrategicSignal]:
    """Return signals filtered by decision type, ordered by created_at descending."""
    client = get_firestore_client()
    settings = get_settings()
    docs = await (
        client.collection(settings.strategic_signals_collection)
        .where(filter=FieldFilter("decision", "==", decision.value))
        .order_by("created_at", direction="DESCENDING")
        .limit(limit)
        .get()
    )
    return [StrategicSignal.model_validate(d.to_dict()) for d in docs]


async def get_signals_by_source(source: str, limit: int = 50) -> list[StrategicSignal]:
    """Return signals from a specific scraper source."""
    client = get_firestore_client()
    settings = get_settings()
    docs = await (
        client.collection(settings.strategic_signals_collection)
        .where(filter=FieldFilter("source", "==", source))
        .order_by("created_at", direction="DESCENDING")
        .limit(limit)
        .get()
    )
    return [StrategicSignal.model_validate(d.to_dict()) for d in docs]


# ── Tribunal Sessions ──────────────────────────────────────────────────────

async def save_tribunal_session(signal_id: str, response: TribunalResponse) -> str:
    """Persist a tribunal session result under tribunal_sessions/{signal_id}."""
    client = get_firestore_client()
    settings = get_settings()
    data = response.model_dump(mode="json")
    data["saved_at"] = datetime.now(timezone.utc).isoformat()
    await client.collection(settings.tribunal_sessions_collection).document(signal_id).set(data)
    logger.info("Saved tribunal session (signal_id=%s, score=%.2f)", signal_id, response.logical_score)
    return signal_id


async def get_tribunal_session(signal_id: str) -> TribunalResponse | None:
    """Fetch a previously saved tribunal session. Returns None if not found."""
    client = get_firestore_client()
    settings = get_settings()
    doc = await (
        client.collection(settings.tribunal_sessions_collection)
        .document(signal_id)
        .get()
    )
    if not doc.exists:
        return None
    data = doc.to_dict()
    data.pop("saved_at", None)
    return TribunalResponse.model_validate(data)


# ── System Config / Coefficient Weights ───────────────────────────────────

async def get_source_weights() -> dict[str, float]:
    """Return current source coefficient weights. Falls back to defaults if not set."""
    client = get_firestore_client()
    settings = get_settings()
    doc = await (
        client.collection(settings.system_config_collection)
        .document("source_weights")
        .get()
    )
    if not doc.exists:
        return dict(_DEFAULT_SOURCE_WEIGHTS)
    stored = doc.to_dict() or {}
    # Merge with defaults so new sources always have a fallback weight
    return {**_DEFAULT_SOURCE_WEIGHTS, **stored}


async def update_coefficients(adjustments: dict[str, float]) -> None:
    """Merge coefficient adjustments into system_config/source_weights.

    Only the keys present in `adjustments` are updated — existing keys
    not in the dict are left unchanged (merge=True).
    """
    client = get_firestore_client()
    settings = get_settings()
    doc_ref = (
        client.collection(settings.system_config_collection)
        .document("source_weights")
    )
    await doc_ref.set(adjustments, merge=True)
    logger.info("Updated source weight coefficients: %s", adjustments)
