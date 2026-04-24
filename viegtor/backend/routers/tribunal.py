"""Persona Tribunal router.

POST /tribunal/summon          — run the 5-persona debate, apply quality gate, persist if score >= threshold
GET  /tribunal/{signal_id}     — retrieve a previously saved tribunal session
GET  /tribunal/weights/current — inspect the live source coefficient weights
"""
import logging

from fastapi import APIRouter, HTTPException, status

from database import signal_repository
from engine import tribunal_engine, coefficient_adjuster
from schemas.signals import TribunalRequest, TribunalResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tribunal", tags=["tribunal"])

# Feedback is only stored when its logical coherence clears this threshold
STORAGE_THRESHOLD = 0.70


@router.post("/summon", response_model=TribunalResponse)
async def summon_tribunal(request: TribunalRequest) -> TribunalResponse:
    """Summon the 5-persona tribunal for a specific signal.

    Flow:
      1. Fetch signal from Firestore
      2. Run 5-persona debate via Gemini Pro
      3. Apply coefficient adjustments to system_config
      4. Quality gate: persist feedback only if logical_score >= STORAGE_THRESHOLD
      5. Return TribunalResponse (stored=True if persisted)
    """
    signal = await signal_repository.get_signal_by_id(request.signal_id)
    if signal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal {request.signal_id!r} not found in Firestore",
        )

    logger.info(
        "Tribunal summoned (signal_id=%s, decision=%s)",
        request.signal_id,
        signal.decision.value,
    )

    try:
        result = await tribunal_engine.run_debate(signal, request.user_feedback)
    except ValueError as exc:
        logger.error("Tribunal engine failed (signal_id=%s): %s", request.signal_id, exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    # Apply any source coefficient adjustments recommended by the tribunal
    applied = await coefficient_adjuster.apply(result.coefficient_adjustments)
    if applied:
        logger.info(
            "Coefficient adjustments applied (signal_id=%s): %s",
            request.signal_id,
            applied,
        )

    # Quality gate — only persist feedback that is coherent and well-grounded
    if result.logical_score >= STORAGE_THRESHOLD:
        await signal_repository.save_tribunal_session(request.signal_id, result)
        result = result.model_copy(update={"stored": True})
        logger.info(
            "Tribunal feedback stored (signal_id=%s, score=%.2f)",
            request.signal_id,
            result.logical_score,
        )
    else:
        logger.info(
            "Tribunal feedback NOT stored — score %.2f below threshold %.2f (signal_id=%s)",
            result.logical_score,
            STORAGE_THRESHOLD,
            request.signal_id,
        )

    return result


@router.get("/weights/current", summary="Inspect live source coefficient weights")
async def get_current_weights() -> dict:
    weights = await signal_repository.get_source_weights()
    return {"source_weights": weights}


@router.get("/{signal_id}", response_model=TribunalResponse, summary="Retrieve a saved tribunal session")
async def get_tribunal_session(signal_id: str) -> TribunalResponse:
    session = await signal_repository.get_tribunal_session(signal_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No tribunal session found for signal {signal_id!r}",
        )
    return session
