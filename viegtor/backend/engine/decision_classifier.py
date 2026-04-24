"""Decision Classifier — pure Python math, zero LLM calls.

Applies source coefficient weights to routing factors and routes each signal
to one of three strategic decisions: BUILD / INVEST / IGNORE.

Decision logic (evaluated in priority order):
  BUILD   — high benefit + quality: clear unmet demand or market gap
  INVEST  — high tech direction: material or technology paradigm shift
  IGNORE  — below minimum quality gate, or no strong signal in any axis

The source_weight (0.3–1.0) scales all factor scores before thresholding,
so a high-weight source (patents = 1.0) needs less raw score to trigger a decision
than a low-weight source (geopolitical news = 0.7).
"""
import logging
from dataclasses import dataclass
from datetime import datetime, timezone

from schemas.decisions import DecisionType, RoutingFactors, UIMetrics

logger = logging.getLogger(__name__)

# Weighted thresholds — tuned for Viega's risk/opportunity profile.
# After tribunal feedback these can be adjusted via the coefficient_adjuster.
_QUALITY_GATE = 0.30         # minimum quality*weight to consider any decision
_BUILD_BENEFIT = 0.60        # benefit threshold for BUILD
_BUILD_QUALITY = 0.50        # minimum quality for BUILD
_INVEST_TECH = 0.58          # tech_direction threshold for INVEST
_INVEST_QUALITY = 0.45       # minimum quality for INVEST


@dataclass
class ClassificationResult:
    decision: DecisionType
    reasoning: str
    weighted_scores: dict[str, float]


def classify(factors: RoutingFactors, source_weight: float) -> ClassificationResult:
    """Apply weighted thresholds and return a ClassificationResult."""
    w = source_weight
    wq = factors.quality_score * w
    wb = factors.benefit_score * w
    wt = factors.timing_score * w
    wtech = factors.tech_direction_score * w

    weighted_scores = {
        "quality": round(wq, 3),
        "benefit": round(wb, 3),
        "timing": round(wt, 3),
        "tech_direction": round(wtech, 3),
        "source_weight": w,
    }

    if wq < _QUALITY_GATE:
        return ClassificationResult(
            decision=DecisionType.IGNORE,
            reasoning=(
                f"Quality gate not met (weighted quality={wq:.2f} < {_QUALITY_GATE}). "
                "Signal lacks sufficient source credibility or evidence strength."
            ),
            weighted_scores=weighted_scores,
        )

    # BUILD: clear market demand gap or unmet customer need
    if wb >= _BUILD_BENEFIT and wq >= _BUILD_QUALITY:
        return ClassificationResult(
            decision=DecisionType.BUILD,
            reasoning=(
                f"Market opportunity identified (weighted benefit={wb:.2f}, quality={wq:.2f}). "
                "Strong demand signal suggests an unmet need Viega can address with a new product or feature."
            ),
            weighted_scores=weighted_scores,
        )

    # INVEST: technology or material paradigm shift in progress
    if wtech >= _INVEST_TECH and wq >= _INVEST_QUALITY:
        return ClassificationResult(
            decision=DecisionType.INVEST,
            reasoning=(
                f"Technology shift signal (weighted tech_direction={wtech:.2f}, quality={wq:.2f}). "
                "Indicates a material or technology direction change worth investing in early."
            ),
            weighted_scores=weighted_scores,
        )

    return ClassificationResult(
        decision=DecisionType.IGNORE,
        reasoning=(
            f"No dominant strategic signal (quality={wq:.2f}, benefit={wb:.2f}, "
            f"timing={wt:.2f}, tech={wtech:.2f}). "
            "Scores are below all decision thresholds — likely noise or low-relevance content."
        ),
        weighted_scores=weighted_scores,
    )


# ── Tier routing ───────────────────────────────────────────────────────────────

_ACT_COMPOSITE   = 0.65
_TRACK_COMPOSITE = 0.40
_ACT_AGE_HOURS   = 24
_TRACK_AGE_HOURS = 72


@dataclass
class TierResult:
    tier: str        # "ACT" | "TRACK" | "FILED"
    reasoning: str


def compute_tier(
    decision: DecisionType,
    ui_metrics: UIMetrics,
    routing_factors: RoutingFactors,
    source_weight: float,
    created_at: datetime,
) -> TierResult:
    """Route a signal to ACT / TRACK / FILED for dashboard display.

    IGNORE decisions are always FILED regardless of scores.
    composite = urgency×0.40 + impact×0.30 + (quality×source_weight)×0.30
    Age gates prevent stale signals from surfacing as high-priority.
    """
    if decision == DecisionType.IGNORE:
        return TierResult(
            tier="FILED",
            reasoning="FILED: decision is IGNORE — no strategic action required regardless of scores.",
        )

    aware_created = (
        created_at.replace(tzinfo=timezone.utc)
        if created_at.tzinfo is None
        else created_at
    )
    age_hours = (datetime.now(timezone.utc) - aware_created).total_seconds() / 3600

    urgency_contrib    = ui_metrics.urgency * 0.40
    impact_contrib     = ui_metrics.impact  * 0.30
    confidence         = routing_factors.quality_score * source_weight
    confidence_contrib = confidence * 0.30
    composite          = urgency_contrib + impact_contrib + confidence_contrib

    score_breakdown = (
        f"urgency={ui_metrics.urgency:.2f}×0.40={urgency_contrib:.3f}, "
        f"impact={ui_metrics.impact:.2f}×0.30={impact_contrib:.3f}, "
        f"confidence=(quality={routing_factors.quality_score:.2f}×weight={source_weight:.2f})"
        f"×0.30={confidence_contrib:.3f} → composite={composite:.3f}, age={age_hours:.1f}h"
    )

    if composite >= _ACT_COMPOSITE and age_hours < _ACT_AGE_HOURS:
        return TierResult(
            tier="ACT",
            reasoning=(
                f"ACT tier: {score_breakdown}. "
                f"Composite ≥ {_ACT_COMPOSITE} and age < {_ACT_AGE_HOURS}h — "
                "high urgency and impact from a credible source; decision requires attention this week."
            ),
        )

    if composite >= _TRACK_COMPOSITE and age_hours < _TRACK_AGE_HOURS:
        return TierResult(
            tier="TRACK",
            reasoning=(
                f"TRACK tier: {score_breakdown}. "
                f"Composite ≥ {_TRACK_COMPOSITE} and age < {_TRACK_AGE_HOURS}h — "
                "signal is real but not time-critical; add to watchlist."
            ),
        )

    return TierResult(
        tier="FILED",
        reasoning=(
            f"FILED tier: {score_breakdown}. "
            f"Composite < {_TRACK_COMPOSITE} or age ≥ {_TRACK_AGE_HOURS}h — "
            "archived for context, no immediate action needed."
        ),
    )
