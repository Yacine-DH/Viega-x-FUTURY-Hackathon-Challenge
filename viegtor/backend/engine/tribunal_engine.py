"""5-Persona Tribunal Engine.

Sends a StrategicSignal + PM feedback to Gemini 1.5 Pro with the
TRIBUNAL_SYSTEM_PROMPT, which simulates a structured debate between
Josef, Steffen, David, Volkmar, and Nick.

The model returns a structured JSON consensus with:
  - per-persona arguments and votes
  - a final consensus decision (may override the original AI decision)
  - recommended coefficient adjustments

Runs in asyncio.to_thread since the Vertex AI SDK is synchronous.
Raises ValueError on any LLM or parse failure — callers must handle it.
"""
import asyncio
import json
import logging

from pydantic import ValidationError

from engine.prompts import TRIBUNAL_SYSTEM_PROMPT, TRIBUNAL_USER_TEMPLATE
from engine.vertex_client import get_pro_model, make_json_config
from schemas.signals import StrategicSignal, TribunalResponse

logger = logging.getLogger(__name__)

# Higher temperature gives the personas more distinct voices without sacrificing JSON structure
_JSON_CONFIG = make_json_config(temperature=0.4)

_VALID_DECISIONS = {"BUILD", "INVEST", "IGNORE"}


async def run_debate(signal: StrategicSignal, user_feedback: str) -> TribunalResponse:
    """Run the 5-persona debate for a signal and return the structured consensus.

    Raises ValueError if the LLM call fails or the output cannot be parsed.
    """
    model = get_pro_model()
    user_prompt = TRIBUNAL_USER_TEMPLATE.format(
        title=signal.title,
        summary=signal.summary,
        current_decision=signal.decision.value,
        current_reasoning=signal.reasoning,
        user_feedback=user_feedback.strip() or "(No additional feedback provided by PM)",
    )

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            [TRIBUNAL_SYSTEM_PROMPT, user_prompt],
            generation_config=_JSON_CONFIG,
        )
        raw_text = response.text.strip()
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

    # Normalise and guard the consensus_decision value before Pydantic validation
    raw_decision = str(data.get("consensus_decision", "")).upper().strip()
    if raw_decision not in _VALID_DECISIONS:
        logger.warning(
            "Tribunal returned invalid consensus_decision=%r — falling back to original %s",
            raw_decision,
            signal.decision.value,
        )
        data["consensus_decision"] = signal.decision.value

    # Clamp any coefficient adjustments to [0.0, 1.0] before validation
    if "coefficient_adjustments" in data and isinstance(data["coefficient_adjustments"], dict):
        data["coefficient_adjustments"] = {
            k: max(0.0, min(1.0, float(v)))
            for k, v in data["coefficient_adjustments"].items()
            if isinstance(v, (int, float))
        }

    try:
        return TribunalResponse(signal_id=signal.signal_id, **data)
    except ValidationError as exc:
        logger.error(
            "Tribunal response failed Pydantic validation (signal_id=%s): %s",
            signal.signal_id, exc,
        )
        raise ValueError(f"Tribunal response schema mismatch: {exc}") from exc
