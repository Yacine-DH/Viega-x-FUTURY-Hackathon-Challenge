from enum import Enum
from pydantic import BaseModel, Field


class DecisionType(str, Enum):
    BUILD = "BUILD"
    INVEST = "INVEST"
    IGNORE = "IGNORE"


class RoutingFactors(BaseModel):
    quality_score: float = Field(..., ge=0.0, le=1.0)
    benefit_score: float = Field(..., ge=0.0, le=1.0)
    timing_score: float = Field(..., ge=0.0, le=1.0)
    tech_direction_score: float = Field(..., ge=0.0, le=1.0)


class UIMetrics(BaseModel):
    relevance: float = Field(..., ge=0.0, le=1.0)
    impact: float = Field(..., ge=0.0, le=1.0)
    urgency: float = Field(..., ge=0.0, le=1.0)
    risk: float = Field(..., ge=0.0, le=1.0)
    profit_impact: float = Field(..., ge=0.0, le=1.0)


class StrategicDecision(BaseModel):
    decision_type: DecisionType
    routing_factors: RoutingFactors
    ui_metrics: UIMetrics
    reasoning: str
    source_weight: float = Field(..., ge=0.0, le=1.0)
