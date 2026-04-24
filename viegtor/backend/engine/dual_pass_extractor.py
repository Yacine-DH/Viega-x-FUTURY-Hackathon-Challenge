"""Vertex AI Dual-Pass Intelligence Extractor.

Pass 1 (Gemini Pro): Extracts routing factors + title/summary/evidence_trail.
Pass 2 (Gemini Pro): Estimates UI display metrics.

Both passes enforce strict JSON output. Pass 2 receives the enriched
title/summary from Pass 1, so it benefits from the first-pass context.
Runs in asyncio.to_thread since the Vertex AI SDK is synchronous.
"""
import asyncio
import json
import logging
from dataclasses import dataclass

from pydantic import BaseModel, Field, ValidationError

from engine.prompts import (
    DUAL_PASS_1_SYSTEM_PROMPT,
    DUAL_PASS_1_USER_TEMPLATE,
    DUAL_PASS_2_SYSTEM_PROMPT,
    DUAL_PASS_2_USER_TEMPLATE,
)
from engine.vertex_client import get_pro_model, make_json_config
from schemas.decisions import RoutingFactors, UIMetrics
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

_JSON_CONFIG = make_json_config(temperature=0.1)


class _Pass1Raw(BaseModel):
    """Internal model for deserializing Pass 1 LLM output."""
    title: str
    summary: str
    quality_score: float = Field(..., ge=0.0, le=1.0)
    benefit_score: float = Field(..., ge=0.0, le=1.0)
    timing_score: float = Field(..., ge=0.0, le=1.0)
    tech_direction_score: float = Field(..., ge=0.0, le=1.0)
    evidence_trail: list[str]


class _Pass2Raw(BaseModel):
    """Internal model for deserializing Pass 2 LLM output."""
    relevance: float = Field(..., ge=0.0, le=1.0)
    impact: float = Field(..., ge=0.0, le=1.0)
    urgency: float = Field(..., ge=0.0, le=1.0)
    risk: float = Field(..., ge=0.0, le=1.0)
    profit_impact: float = Field(..., ge=0.0, le=1.0)


@dataclass
class DualPassResult:
    title: str
    summary: str
    routing_factors: RoutingFactors
    ui_metrics: UIMetrics
    evidence_trail: list[str]


async def extract(signal: RawSignal) -> DualPassResult:
    """Run both passes sequentially. Raises ValueError if either pass fails parsing."""
    model = get_pro_model()
    pass1 = await _run_pass1(model, signal)
    pass2 = await _run_pass2(model, signal, pass1)

    routing_factors = RoutingFactors(
        quality_score=pass1.quality_score,
        benefit_score=pass1.benefit_score,
        timing_score=pass1.timing_score,
        tech_direction_score=pass1.tech_direction_score,
    )
    ui_metrics = UIMetrics(
        relevance=pass2.relevance,
        impact=pass2.impact,
        urgency=pass2.urgency,
        risk=pass2.risk,
        profit_impact=pass2.profit_impact,
    )
    return DualPassResult(
        title=pass1.title,
        summary=pass1.summary,
        routing_factors=routing_factors,
        ui_metrics=ui_metrics,
        evidence_trail=pass1.evidence_trail,
    )


async def _run_pass1(model, signal: RawSignal) -> _Pass1Raw:
    prompt = DUAL_PASS_1_USER_TEMPLATE.format(
        source=signal.source,
        url=signal.url,
        raw_text=signal.raw_text[:4000],
    )
    try:
        response = await asyncio.to_thread(
            model.generate_content,
            [DUAL_PASS_1_SYSTEM_PROMPT, prompt],
            generation_config=_JSON_CONFIG,
        )
        data = json.loads(response.text.strip())
        return _Pass1Raw.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.error("Pass 1 JSON parse failed (source=%s): %s | raw=%s", signal.source, exc,
                     getattr(exc, '__context__', ''))
        raise ValueError(f"Pass 1 failed for {signal.source}: {exc}") from exc
    except Exception as exc:
        logger.exception("Pass 1 Vertex AI call failed (source=%s)", signal.source)
        raise ValueError(f"Pass 1 LLM error for {signal.source}: {exc}") from exc


async def _run_pass2(model, signal: RawSignal, pass1: _Pass1Raw) -> _Pass2Raw:
    prompt = DUAL_PASS_2_USER_TEMPLATE.format(
        title=pass1.title,
        summary=pass1.summary,
        source=signal.source,
        source_weight=signal.source_weight,
    )
    try:
        response = await asyncio.to_thread(
            model.generate_content,
            [DUAL_PASS_2_SYSTEM_PROMPT, prompt],
            generation_config=_JSON_CONFIG,
        )
        data = json.loads(response.text.strip())
        return _Pass2Raw.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.error("Pass 2 JSON parse failed (source=%s): %s", signal.source, exc)
        raise ValueError(f"Pass 2 failed for {signal.source}: {exc}") from exc
    except Exception as exc:
        logger.exception("Pass 2 Vertex AI call failed (source=%s)", signal.source)
        raise ValueError(f"Pass 2 LLM error for {signal.source}: {exc}") from exc
