from datetime import datetime
from typing import Annotated, Literal
from pydantic import BaseModel, Field

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
    tier: Literal["ACT", "TRACK", "FILED"] = Field(default="FILED", description="Dashboard priority tier")
    tier_reasoning: str = Field(default="", description="Explains how the tier was computed")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TribunalRequest(BaseModel):
    signal_id: str
    user_feedback: Annotated[str, Field(description="Free-text context from the PM before summoning the tribunal")]


class TribunalResponse(BaseModel):
    signal_id: str
    persona_arguments: dict[str, str] = Field(
        description="Maps persona name to their 2-3 sentence expert opinion on the signal"
    )
    consensus_feedback: str = Field(
        description="Middle-ground synthesis — actionable feedback for the Product Manager"
    )
    logical_score: float = Field(
        ..., ge=0.0, le=1.0,
        description="Coherence and groundedness quality score (0=vague, 1=specific and evidence-backed)"
    )
    stored: bool = Field(
        default=False,
        description="True if this feedback cleared the quality threshold and was persisted"
    )
    coefficient_adjustments: dict[str, float] = Field(
        default_factory=dict,
        description="Source keys mapped to adjusted weight values (0.0–1.0)"
    )
