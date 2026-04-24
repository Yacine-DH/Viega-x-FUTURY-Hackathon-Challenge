"""Read endpoints for the dashboard and RAG chatbot.

GET /signals              — recent signals (optional ?decision= filter)
GET /signals/{signal_id}  — single signal by ID
GET /signals/stats        — counts per decision type (dashboard summary card)
"""
import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from database import signal_repository
from schemas.decisions import DecisionType
from schemas.signals import StrategicSignal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("", response_model=list[StrategicSignal])
async def list_signals(
    decision: Annotated[DecisionType | None, Query(description="Filter by decision type")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[StrategicSignal]:
    if decision:
        return await signal_repository.get_signals_by_decision(decision, limit=limit)
    return await signal_repository.get_signals(limit=limit)


@router.get("/stats")
async def signal_stats() -> dict:
    """Return signal counts per decision type — used by the dashboard summary card."""
    all_signals = await signal_repository.get_signals(limit=500)
    counts: dict[str, int] = {d.value: 0 for d in DecisionType}
    for s in all_signals:
        counts[s.decision.value] += 1
    return {"total": len(all_signals), "by_decision": counts}


@router.get("/{signal_id}", response_model=StrategicSignal)
async def get_signal(signal_id: str) -> StrategicSignal:
    signal = await signal_repository.get_signal_by_id(signal_id)
    if signal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Signal {signal_id!r} not found")
    return signal
