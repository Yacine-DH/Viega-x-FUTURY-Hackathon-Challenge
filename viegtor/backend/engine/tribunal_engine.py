"""5-Persona Tribunal Engine.

Each persona reads the signal's evidence trail and contributes an expert
opinion from their unique worldview. The moderator then synthesises a
middle-ground CONSTRUCTIVE FEEDBACK for the Product Manager — grounded
only in the evidence provided.

This is NOT a BUILD/INVEST/IGNORE re-classifier. The goal is actionable
feedback that surfaces tensions, agreements, and concrete next steps.

A logical_score (0–1) rates coherence. Only sessions above STORAGE_THRESHOLD
are persisted; the router owns that gate and sets `stored=True` on the result.

Raises ValueError on any LLM or parse failure — callers must handle it.
"""
import asyncio
import json
import logging
import re

from pydantic import ValidationError

from engine.prompts import TRIBUNAL_SYSTEM_PROMPT, TRIBUNAL_USER_TEMPLATE
from engine.vertex_client import get_pro_model, make_tribunal_config
from schemas.signals import StrategicSignal, TribunalResponse

logger = logging.getLogger(__name__)

_TRIBUNAL_CONFIG = make_tribunal_config()

# Matches a markdown code fence that Gemini occasionally wraps JSON in
_CODE_FENCE_RE = re.compile(r'^```(?:json)?\s*\n?|\n?```\s*$', re.MULTILINE)


def _extract_json(text: str) -> str:
    """Strip markdown fences and isolate the outermost JSON object."""
    text = _CODE_FENCE_RE.sub('', text).strip()
    # Find the first '{' and the matching last '}' in case there is trailing prose
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


async def run_debate(signal: StrategicSignal, user_feedback: str) -> TribunalResponse:
    """Run the 5-persona debate and return structured constructive feedback.

    Raises ValueError if the LLM call fails or output cannot be parsed.
    """
    model = get_pro_model()

    evidence_block = "\n".join(f"- {e}" for e in signal.evidence_trail) or "(no evidence trail)"

    user_prompt = TRIBUNAL_USER_TEMPLATE.format(
        title=signal.title,
        summary=signal.summary,
        current_decision=signal.decision.value,
        current_reasoning=signal.reasoning,
        evidence_trail=evidence_block,
        user_feedback=user_feedback.strip() or "(No additional context provided by PM)",
    )

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            [TRIBUNAL_SYSTEM_PROMPT, user_prompt],
            generation_config=_TRIBUNAL_CONFIG,
        )
        raw_text = _extract_json(response.text)
    except Exception as exc:
        logger.exception("Tribunal Vertex AI call failed (signal_id=%s)", signal.signal_id)
        raise ValueError(f"Tribunal LLM call failed: {exc}") from exc

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        logger.error(
            "Tribunal returned invalid JSON (signal_id=%s): %s\nRaw: %s",
            signal.signal_id, exc, raw_text[:500],
        )
        raise ValueError(f"Tribunal returned unparseable JSON: {exc}") from exc

    # Clamp logical_score to [0.0, 1.0]
    raw_score = data.get("logical_score", 0.5)
    try:
        data["logical_score"] = max(0.0, min(1.0, float(raw_score)))
    except (TypeError, ValueError):
        data["logical_score"] = 0.5

    # Ensure persona_arguments is a flat dict[str, str]
    args = data.get("persona_arguments", {})
    if isinstance(args, dict):
        data["persona_arguments"] = {
            str(k): str(v) for k, v in args.items()
        }
    else:
        data["persona_arguments"] = {}

    # Clamp any coefficient adjustments to [0.0, 1.0]
    raw_adj = data.get("coefficient_adjustments", {})
    if isinstance(raw_adj, dict):
        data["coefficient_adjustments"] = {
            k: max(0.0, min(1.0, float(v)))
            for k, v in raw_adj.items()
            if isinstance(v, (int, float))
        }
    else:
        data["coefficient_adjustments"] = {}

    # `stored` is set by the router after the quality gate — always False here
    data["stored"] = False

    try:
        return TribunalResponse(signal_id=signal.signal_id, **data)
    except ValidationError as exc:
        logger.error(
            "Tribunal response failed Pydantic validation (signal_id=%s): %s",
            signal.signal_id, exc,
        )
        raise ValueError(f"Tribunal response schema mismatch: {exc}") from exc
