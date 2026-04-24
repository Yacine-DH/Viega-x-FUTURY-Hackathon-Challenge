from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field, HttpUrl

from schemas.decisions import DecisionType, RoutingFactors, UIMetrics


class RawSignal(BaseModel):
    source: Annotated[str, Field(description="Scraper identifier, e.g. 'epo_patents', 'eurlex'")]
    url: str
    raw_text: str
    timestamp: datetime
    source_weight: float = Field(..., ge=0.0, le=1.0, description="Coefficient from CLAUDE.md source table")


class FilteredSignal(BaseModel):
    source: str
    url: str
    raw_text: str
    timestamp: datetime
    source_weight: float = Field(..., ge=0.0, le=1.0)
    relevant: bool
    filter_reason: str


class StrategicSignal(BaseModel):
    signal_id: str
    source: str
    url: str
    title: str
    summary: str
    timestamp: datetime
    source_weight: float = Field(..., ge=0.0, le=1.0)
    decision: DecisionType
    routing_factors: RoutingFactors
    ui_metrics: UIMetrics
    reasoning: str
    evidence_trail: list[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TribunalRequest(BaseModel):
    signal_id: str
    user_feedback: Annotated[str, Field(description="Free-text context from the PM before summoning the tribunal")]


class TribunalResponse(BaseModel):
    signal_id: str
    persona_votes: dict[str, str] = Field(
        description="Maps persona name to their argued position"
    )
    consensus_decision: DecisionType
    consensus_reasoning: str
    coefficient_adjustments: dict[str, float] = Field(
        description="Source keys mapped to new weight values (0.0–1.0)"
    )
