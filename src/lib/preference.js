// Strategic Preference logic
// Frontend placeholder for backend team. Keep signature when swapping impl.

export function applyPreference(signal, preference) {
  const base = signal.recommendation;
  if (preference === 'balanced') return base;

  if (preference === 'conservative') {
    if (base === 'BUILD' && signal.confidence < 85) return 'INVEST';
    if (base === 'INVEST' && signal.impact < 60) return 'IGNORE';
    return base;
  }

  if (preference === 'aggressive') {
    if (base === 'INVEST' && signal.impact >= 65) return 'BUILD';
    if (base === 'IGNORE' && signal.impact >= 70) return 'INVEST';
    return base;
  }

  return base;
}

export function getConfidenceAdjusted(signal, preference) {
  if (preference === 'conservative') return Math.max(0, signal.confidence - 6);
  if (preference === 'aggressive') return Math.min(99, signal.confidence + 4);
  return signal.confidence;
}

export function signalBaseline(signal) {
  return signal.recommendation;
}
