import logging
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, status

from config import Settings, get_settings
from database import signal_repository
from engine import zero_shot_filter, dual_pass_extractor, decision_classifier
from schemas.signals import RawSignal, StrategicSignal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_signal(
    signal: RawSignal,
    settings: Settings = Depends(get_settings),
) -> dict:
    # ── Phase 2: Time filter ──────────────────────────────────────────────
    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.signal_max_age_hours)
    signal_time = (
        signal.timestamp.replace(tzinfo=timezone.utc)
        if signal.timestamp.tzinfo is None
        else signal.timestamp
    )
    if signal_time < cutoff:
        logger.info("Discarded stale signal (source=%s, age>%dh)", signal.source, settings.signal_max_age_hours)
        return {"status": "discarded", "reason": "signal_too_old"}

    # ── Phase 3a: Zero-shot anti-hallucination filter ─────────────────────
    zero_shot = await zero_shot_filter.classify_signal(signal)
    if not zero_shot.relevant:
        logger.info("Signal filtered as irrelevant (source=%s, reason=%s)", signal.source, zero_shot.reason)
        return {"status": "discarded", "reason": "irrelevant", "filter_reason": zero_shot.reason}

    logger.info("Signal passed zero-shot filter (source=%s)", signal.source)

    # ── Phase 3b: Dual-pass extraction ───────────────────────────────────
    try:
        extracted = await dual_pass_extractor.extract(signal)
    except ValueError as exc:
        logger.error("Dual-pass extraction failed (source=%s): %s", signal.source, exc)
        return {"status": "error", "reason": str(exc)}

    # ── Phase 3c: Decision classification ────────────────────────────────
    classification = decision_classifier.classify(
        extracted.routing_factors, signal.source_weight
    )
    logger.info(
        "Decision: %s (source=%s, weighted_quality=%.2f)",
        classification.decision,
        signal.source,
        classification.weighted_scores["quality"],
    )

    # ── Build StrategicSignal ─────────────────────────────────────────────
    strategic_signal = StrategicSignal(
        signal_id=str(uuid.uuid4()),
        source=signal.source,
        url=signal.url,
        title=extracted.title,
        summary=extracted.summary,
        timestamp=signal.timestamp,
        source_weight=signal.source_weight,
        decision=classification.decision,
        routing_factors=extracted.routing_factors,
        ui_metrics=extracted.ui_metrics,
        reasoning=classification.reasoning,
        evidence_trail=extracted.evidence_trail,
    )

    await signal_repository.save_signal(strategic_signal)

    return {
        "status": "processed",
        "signal_id": strategic_signal.signal_id,
        "decision": strategic_signal.decision,
        "title": strategic_signal.title,
        "reasoning": strategic_signal.reasoning,
        "weighted_scores": classification.weighted_scores,
    }
