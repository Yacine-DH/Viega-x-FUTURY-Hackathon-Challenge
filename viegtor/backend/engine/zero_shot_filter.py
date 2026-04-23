"""Zero-Shot Anti-Hallucination Filter.

Calls Gemini 1.5 Flash to decide whether a raw signal is relevant
to Viega's strategic interests. Runs in a thread executor since the
Vertex AI SDK is synchronous.

Output contract: always returns a ZeroShotResult — never raises on LLM failure
(returns relevant=False with the error as the reason instead).
"""
import asyncio
import json
import logging

from pydantic import BaseModel, ValidationError
from vertexai.generative_models import GenerativeModel

from engine.prompts import ZERO_SHOT_SYSTEM_PROMPT, ZERO_SHOT_USER_TEMPLATE
from engine.vertex_client import get_flash_model, make_json_config
from schemas.signals import RawSignal

logger = logging.getLogger(__name__)

_JSON_CONFIG = make_json_config(temperature=0.0)


class ZeroShotResult(BaseModel):
    relevant: bool
    reason: str


async def classify_signal(signal: RawSignal) -> ZeroShotResult:
    """Return relevance classification for a raw signal. Never raises."""
    model = get_flash_model()
    prompt = ZERO_SHOT_USER_TEMPLATE.format(
        source=signal.source,
        url=signal.url,
        raw_text=signal.raw_text[:3000],  # cap to avoid token overflow
    )

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            [ZERO_SHOT_SYSTEM_PROMPT, prompt],
            generation_config=_JSON_CONFIG,
        )
        raw_json = response.text.strip()
        data = json.loads(raw_json)
        return ZeroShotResult.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.error(
            "Zero-shot filter returned unparseable JSON (source=%s): %s",
            signal.source,
            exc,
        )
        return ZeroShotResult(relevant=False, reason=f"LLM parse error: {exc}")
    except Exception as exc:
        logger.exception("Zero-shot filter failed (source=%s)", signal.source)
        return ZeroShotResult(relevant=False, reason=f"LLM call error: {exc}")
