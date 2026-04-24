"""Coefficient adjuster — validates and persists tribunal weight changes.

Clamps all incoming values to [MIN_WEIGHT, MAX_WEIGHT] so a rogue LLM output
can never zero-out a source or push weights above 1.0.
Only non-empty, numeric adjustments are written to Firestore.
"""
import logging

from database import signal_repository

logger = logging.getLogger(__name__)

_MIN_WEIGHT = 0.1   # never let a source weight drop to zero — it would silence it permanently
_MAX_WEIGHT = 1.0


async def apply(adjustments: dict[str, float]) -> dict[str, float]:
    """Clamp and persist coefficient adjustments. Returns the clamped dict actually saved.

    Does nothing and returns {} if adjustments is empty or contains no valid entries.
    """
    if not adjustments:
        return {}

    clamped: dict[str, float] = {}
    for source, value in adjustments.items():
        if not isinstance(value, (int, float)):
            logger.warning("Skipping non-numeric coefficient for source=%r: %r", source, value)
            continue
        clamped_val = round(max(_MIN_WEIGHT, min(_MAX_WEIGHT, float(value))), 4)
        if clamped_val != value:
            logger.info(
                "Coefficient clamped for source=%r: %.4f → %.4f", source, value, clamped_val
            )
        clamped[source] = clamped_val

    if clamped:
        await signal_repository.update_coefficients(clamped)
        logger.info("Persisted coefficient adjustments to Firestore: %s", clamped)
    else:
        logger.info("No valid coefficient adjustments to persist")

    return clamped
