"""Vertex AI client — singleton initialization and model accessors.

Call init_vertex_ai() once at startup (FastAPI lifespan).
Then use get_flash_model() / get_pro_model() anywhere in the engine layer.
The Vertex AI SDK is synchronous; all callers must wrap calls with asyncio.to_thread().
"""
import logging
from functools import lru_cache

import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig

from config import get_settings

logger = logging.getLogger(__name__)

_initialized = False


def init_vertex_ai() -> None:
    """Initialize the Vertex AI SDK. Idempotent — safe to call multiple times."""
    global _initialized
    if _initialized:
        return
    settings = get_settings()
    vertexai.init(project=settings.gcp_project_id, location=settings.gcp_location)
    _initialized = True
    logger.info(
        "Vertex AI initialized (project=%s, location=%s)",
        settings.gcp_project_id,
        settings.gcp_location,
    )


@lru_cache(maxsize=1)
def get_flash_model() -> GenerativeModel:
    """Gemini 1.5 Flash — fast zero-shot classification."""
    init_vertex_ai()
    model_id = get_settings().gemini_flash_model
    logger.info("Loading Gemini Flash model: %s", model_id)
    return GenerativeModel(
        model_id,
        system_instruction="You are a strategic intelligence filter for Viega. Return only valid JSON.",
    )


@lru_cache(maxsize=1)
def get_pro_model() -> GenerativeModel:
    """Gemini 1.5 Pro — dual-pass reasoning, tribunal, RAG."""
    init_vertex_ai()
    model_id = get_settings().gemini_pro_model
    logger.info("Loading Gemini Pro model: %s", model_id)
    return GenerativeModel(
        model_id,
        system_instruction="You are a strategic intelligence analyst for Viega. Return only valid JSON unless streaming.",
    )


def make_json_config(temperature: float = 0.1) -> GenerationConfig:
    """GenerationConfig that forces strict JSON output."""
    return GenerationConfig(
        temperature=temperature,
        response_mime_type="application/json",
        max_output_tokens=2048,
    )


def make_stream_config(temperature: float = 0.2) -> GenerationConfig:
    """GenerationConfig for streaming text responses (RAG chatbot)."""
    return GenerationConfig(
        temperature=temperature,
        max_output_tokens=1024,
    )
