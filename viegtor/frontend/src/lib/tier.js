export function computeTier(decision, confidence) {
  if (decision === 'IGNORE') return 'FIELD';
  return confidence >= 80 ? 'ACT' : 'TRACK';
}

export const TIER_META = {
  ACT: {
    color: '#EF4444',
    glow: 'rgba(239,68,68,0.35)',
    title: 'ACT — Immediate Priority',
  },
  TRACK: {
    color: '#FFCC00',
    glow: 'rgba(255,204,0,0.25)',
    title: 'TRACK — Monitor Progress',
  },
  FIELD: {
    color: '#52525b',
    glow: 'rgba(82,82,91,0.2)',
    title: 'FIELD — Ignored Signals',
  },
};
