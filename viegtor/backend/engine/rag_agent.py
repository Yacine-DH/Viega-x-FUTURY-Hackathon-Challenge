"""RAG Evidence Chatbot agent.

Retrieves a StrategicSignal's full context from Firestore and injects it
into a Gemini 2.5 Flash prompt. Answers are grounded strictly in the stored
evidence trail — the model is forbidden from adding outside knowledge.

Streaming architecture:
  Vertex AI SDK is synchronous. We bridge it to an async generator using
  asyncio.Queue + run_in_executor so FastAPI can stream SSE chunks without
  blocking the event loop.
"""
import asyncio
import logging
from collections.abc import AsyncGenerator

from engine.prompts import RAG_SYSTEM_PROMPT, RAG_USER_TEMPLATE
from engine.vertex_client import get_pro_model, make_stream_config
from schemas.signals import StrategicSignal

logger = logging.getLogger(__name__)

_STREAM_CONFIG = make_stream_config(temperature=0.2)


def _build_prompt(signal: StrategicSignal, question: str) -> str:
    evidence_formatted = "\n".join(f"  - {e}" for e in signal.evidence_trail) or "  (no evidence trail recorded)"
    return RAG_USER_TEMPLATE.format(
        signal_id=signal.signal_id,
        title=signal.title,
        summary=signal.summary,
        decision=signal.decision.value,
        reasoning=signal.reasoning,
        source=signal.source,
        url=signal.url,
        source_weight=signal.source_weight,
        quality_score=round(signal.routing_factors.quality_score, 3),
        benefit_score=round(signal.routing_factors.benefit_score, 3),
        timing_score=round(signal.routing_factors.timing_score, 3),
        tech_direction_score=round(signal.routing_factors.tech_direction_score, 3),
        relevance=round(signal.ui_metrics.relevance, 3),
        impact=round(signal.ui_metrics.impact, 3),
        urgency=round(signal.ui_metrics.urgency, 3),
        risk=round(signal.ui_metrics.risk, 3),
        profit_impact=round(signal.ui_metrics.profit_impact, 3),
        evidence_trail=evidence_formatted,
        user_question=question,
    )


async def stream_answer(signal: StrategicSignal, question: str) -> AsyncGenerator[str, None]:
    """Yield Gemini text chunks as they arrive from the streaming API.

    Uses a thread + asyncio.Queue to bridge the synchronous Vertex AI SDK
    to an async generator without blocking the event loop.
    """
    model = get_pro_model()
    user_prompt = _build_prompt(signal, question)
    prompt_parts = [RAG_SYSTEM_PROMPT, user_prompt]

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue[str | None] = asyncio.Queue()

    def _run_sync() -> None:
        try:
            for chunk in model.generate_content(
                prompt_parts,
                stream=True,
                generation_config=_STREAM_CONFIG,
            ):
                text = chunk.text if hasattr(chunk, "text") else ""
                if text:
                    asyncio.run_coroutine_threadsafe(queue.put(text), loop)
        except Exception as exc:
            logger.exception(
                "RAG streaming error (signal_id=%s, question=%r)",
                signal.signal_id,
                question[:60],
            )
            asyncio.run_coroutine_threadsafe(
                queue.put(f"\n\n[Streaming error: {exc}]"), loop
            )
        finally:
            asyncio.run_coroutine_threadsafe(queue.put(None), loop)

    loop.run_in_executor(None, _run_sync)

    while True:
        token = await queue.get()
        if token is None:
            break
        yield token


async def get_full_answer(signal: StrategicSignal, question: str) -> str:
    """Non-streaming variant — collects all chunks into a single string.

    Use for testing or integrations that don't support SSE.
    """
    chunks: list[str] = []
    async for chunk in stream_answer(signal, question):
        chunks.append(chunk)
    return "".join(chunks)
