# Signal Tier Routing — ACT / TRACK / FILED

Documents exactly what was added, why, and how to replicate the same pattern in any other project with a similar signal pipeline.

---

## What it does

Every processed signal is automatically assigned to one of three dashboard tiers:

| Tier | Meaning | Visibility |
|------|---------|------------|
| **ACT** | Decision needed this week — high urgency, high impact, credible source, fresh | Always expanded at the top |
| **TRACK** | Real signal, not time-critical — add to watchlist | Collapsed by default, one click to expand |
| **FILED** | No action needed — noise filtered, stale, or IGNORE decision | Count badge only, never shown as cards |

The tier is computed with **pure math, zero LLM calls**, using scores the dual-pass extractor already produced.

---

## Files changed (3 total)

### 1. `engine/decision_classifier.py`
### 2. `schemas/signals.py`
### 3. `routers/webhook.py`

Nothing else was touched.

---

## File 1 — `engine/decision_classifier.py`

### What was added

Two new imports at the top:

```python
from datetime import datetime, timezone
from schemas.decisions import DecisionType, RoutingFactors, UIMetrics
# UIMetrics was not imported before — add it alongside the existing imports
```

One new dataclass and one new function appended **after** the existing `classify()` function.

### Constants added

```python
# Tier thresholds — composite score cutoffs and age gates for dashboard routing.
_ACT_COMPOSITE   = 0.65
_TRACK_COMPOSITE = 0.40
_ACT_AGE_HOURS   = 24
_TRACK_AGE_HOURS = 72
```

### Dataclass added

```python
@dataclass
class TierResult:
    tier: str       # "ACT" | "TRACK" | "FILED"
    reasoning: str
```

### Function added

```python
def compute_tier(
    decision: DecisionType,
    ui_metrics: UIMetrics,
    routing_factors: RoutingFactors,
    source_weight: float,
    created_at: datetime,
) -> TierResult:
    """Route a signal to ACT / TRACK / FILED for dashboard display.

    IGNORE decisions are always FILED regardless of scores.
    For BUILD/INVEST, composite = urgency×0.40 + impact×0.30 + (quality×weight)×0.30.
    Age gates enforce that stale signals do not surface as high-priority.
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
        f"confidence=(quality={routing_factors.quality_score:.2f}×weight={source_weight:.2f})×0.30"
        f"={confidence_contrib:.3f} → composite={composite:.3f}, age={age_hours:.1f}h"
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
```

---

## File 2 — `schemas/signals.py`

### What was added

One import added to the existing `typing` import line:

```python
# Before
from typing import Annotated

# After
from typing import Annotated, Literal
```

Two fields added to `StrategicSignal`, placed **between** `evidence_trail` and `created_at`:

```python
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
    # ↓ ADDED
    tier: Literal["ACT", "TRACK", "FILED"] = Field(default="FILED", description="Dashboard priority tier")
    tier_reasoning: str = Field(default="", description="Explains how the tier was computed; stored as evidence")
    # ↑ ADDED
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

Both fields have defaults so existing documents in the database are not broken.

---

## File 3 — `routers/webhook.py`

### What was added

A new Phase 3d block inserted **between** Phase 3c (decision classification) and the `StrategicSignal` construction. Then two new fields passed into the constructor.

```python
# ── Phase 3d: Tier routing ────────────────────────────────────────────
now = datetime.now(timezone.utc)
tier_result = decision_classifier.compute_tier(
    decision=classification.decision,
    ui_metrics=extracted.ui_metrics,
    routing_factors=extracted.routing_factors,
    source_weight=signal.source_weight,
    created_at=now,
)
evidence_trail = extracted.evidence_trail + [tier_result.reasoning]
```

Then in the `StrategicSignal(...)` constructor, two fields added and `evidence_trail` replaced:

```python
strategic_signal = StrategicSignal(
    ...
    evidence_trail=evidence_trail,      # was extracted.evidence_trail — now includes tier_reasoning appended
    tier=tier_result.tier,              # ADDED
    tier_reasoning=tier_result.reasoning,  # ADDED
)
```

`datetime` and `timezone` were already imported at the top of `webhook.py` — no new imports needed.

---

## Equation explained

```
composite = (urgency × 0.40) + (impact × 0.30) + (quality_score × source_weight × 0.30)
```

| Input | Source field | Weight | Why |
|-------|-------------|--------|-----|
| `urgency` | `UIMetrics.urgency` | 0.40 | Directly encodes time pressure — the primary driver of the tier |
| `impact` | `UIMetrics.impact` | 0.30 | Prevents low-stakes signals from reaching ACT on urgency alone |
| `quality_score × source_weight` | `RoutingFactors.quality_score` × `StrategicSignal.source_weight` | 0.30 | Trust filter — weak evidence from low-credibility sources can't override urgency |

Weights sum to 1.0. Composite always lives in [0.0, 1.0].

### Thresholds

| Condition | Result |
|-----------|--------|
| `decision == IGNORE` | → **FILED** immediately, no math runs |
| `composite ≥ 0.65` AND `age < 24h` | → **ACT** |
| `composite ≥ 0.40` AND `age < 72h` | → **TRACK** |
| anything else | → **FILED** |

The 0.65 threshold means at least two inputs must be strong — you cannot reach ACT with one high score alone.
The 72h age gate matches the existing freshness contract already enforced by the time filter in Phase 2.

---

## Where the tier reasoning is stored

`tier_reasoning` is stored in two places on every `StrategicSignal`:

1. **`tier_reasoning` field** — direct access by the frontend to display "Why ACT?" on the card
2. **`evidence_trail` list** — appended as the last entry, so the RAG chatbot and tribunal can cite it as an argument for the decision

Both point to the same string. One source of truth, two access paths.

---

## How to replicate in another project

Requirements to port this pattern:

1. You need a signal model that already has:
   - A decision enum with at least an IGNORE variant
   - A `urgency` score (0–1) from an LLM extraction pass
   - An `impact` score (0–1) from an LLM extraction pass
   - A `quality_score` (0–1) from an LLM extraction pass
   - A `source_weight` (0–1) representing source credibility
   - A `created_at` timestamp

2. Add `TierResult` dataclass and `compute_tier()` to your classifier module (copy as-is, adjust thresholds for your domain).

3. Add `tier: Literal["ACT", "TRACK", "FILED"]` and `tier_reasoning: str` to your signal schema with safe defaults.

4. In your ingest endpoint, call `compute_tier()` after classification, append the reasoning to your evidence list, and pass both new fields into the signal constructor.

### Adjusting thresholds for a different domain

| Constant | Current value | Change if... |
|----------|--------------|-------------|
| `_ACT_COMPOSITE` | 0.65 | Lower it (e.g. 0.55) if too few signals reach ACT; raise it (e.g. 0.75) if ACT is too noisy |
| `_TRACK_COMPOSITE` | 0.40 | Lower it to widen the watchlist; raise it to make TRACK more selective |
| `_ACT_AGE_HOURS` | 24 | Raise to 48h if your signals stay relevant longer |
| `_TRACK_AGE_HOURS` | 72 | Must match your freshness window — set equal to your time filter cutoff |
| Urgency weight | 0.40 | Raise if time-sensitivity should dominate more; lower if source quality matters more |
| Impact weight | 0.30 | Raise if business magnitude should outweigh urgency |
| Confidence weight | 0.30 | Raise if you want to penalise weak sources more aggressively |
