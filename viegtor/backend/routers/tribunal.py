"""Persona Tribunal router.

POST /tribunal/summon          — run the 5-persona debate, apply coefficients, update Firestore
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


@router.post("/summon", response_model=TribunalResponse)
async def summon_tribunal(request: TribunalRequest) -> TribunalResponse:
    """Summon the 5-persona tribunal for a specific signal.

    Flow:
      1. Fetch signal from Firestore
      2. Run Gemini Pro 5-persona debate
      3. Clamp + persist coefficient adjustments to system_config
      4. If consensus decision differs from original AI decision, update the signal
      5. Persist tribunal session for audit trail
      6. Return full TribunalResponse
    """
    signal = await signal_repository.get_signal_by_id(request.signal_id)
    if signal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Signal {request.signal_id!r} not found in Firestore",
        )

    logger.info(
        "Tribunal summoned (signal_id=%s, original_decision=%s)",
        request.signal_id,
        signal.decision.value,
    )

    # ── Run the 5-persona debate ──────────────────────────────────────────
    try:
        result = await tribunal_engine.run_debate(signal, request.user_feedback)
    except ValueError as exc:
        logger.error("Tribunal engine failed (signal_id=%s): %s", request.signal_id, exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    # ── Apply coefficient adjustments to Firestore system_config ─────────
    applied = await coefficient_adjuster.apply(result.coefficient_adjustments)
    if applied:
        logger.info(
            "Coefficient adjustments applied (signal_id=%s): %s",
            request.signal_id,
            applied,
        )

    # ── Override signal decision in Firestore if consensus differs ────────
    if result.consensus_decision != signal.decision:
        logger.info(
            "Tribunal consensus overrides AI decision (signal_id=%s): %s → %s",
            signal.signal_id,
            signal.decision.value,
            result.consensus_decision.value,
        )
        updated = signal.model_copy(update={"decision": result.consensus_decision})
        await signal_repository.save_signal(updated)

    # ── Persist tribunal session for audit trail ──────────────────────────
    await signal_repository.save_tribunal_session(request.signal_id, result)

    return result


@router.get("/weights/current", summary="Inspect live source coefficient weights")
async def get_current_weights() -> dict:
    """Return the current source coefficient weights stored in system_config.

    Reflects any adjustments previously made by the tribunal.
    """
    weights = await signal_repository.get_source_weights()
    return {"source_weights": weights}


@router.get("/{signal_id}", response_model=TribunalResponse, summary="Retrieve a saved tribunal session")
async def get_tribunal_session(signal_id: str) -> TribunalResponse:
    """Fetch the tribunal debate record for a specific signal."""
    session = await signal_repository.get_tribunal_session(signal_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No tribunal session found for signal {signal_id!r}",
        )
    return session
