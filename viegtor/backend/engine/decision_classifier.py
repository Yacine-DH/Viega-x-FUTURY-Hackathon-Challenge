"""Decision Classifier — pure Python math, zero LLM calls.

Applies source coefficient weights to routing factors and routes each signal
to one of four strategic decisions: BUILD / INVEST / ADJUST / IGNORE.

Decision logic (evaluated in priority order):
  ADJUST  — high timing urgency: competitor is moving NOW, Viega must react
  BUILD   — high benefit + quality: clear unmet demand or market gap
  INVEST  — high tech direction: material or technology paradigm shift
  IGNORE  — below minimum quality gate, or no strong signal in any axis

The source_weight (0.3–1.0) scales all factor scores before thresholding,
so a high-weight source (patents = 1.0) needs less raw score to trigger a decision
than a low-weight source (geopolitical news = 0.7).
"""
import logging
from dataclasses import dataclass

from schemas.decisions import DecisionType, RoutingFactors

logger = logging.getLogger(__name__)

# Weighted thresholds — tuned for Viega's risk/opportunity profile.
# After tribunal feedback these can be adjusted via the coefficient_adjuster.
_QUALITY_GATE = 0.30         # minimum quality*weight to consider any decision
_ADJUST_TIMING = 0.60        # timing urgency threshold for ADJUST
_ADJUST_QUALITY = 0.48       # minimum quality for ADJUST
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

    # ADJUST: competitor is already moving — highest priority response needed
    if wt >= _ADJUST_TIMING and wq >= _ADJUST_QUALITY:
        return ClassificationResult(
            decision=DecisionType.ADJUST,
            reasoning=(
                f"Competitor threat detected (weighted timing={wt:.2f}, quality={wq:.2f}). "
                "High urgency indicates an active competitive move requiring immediate strategic response."
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
