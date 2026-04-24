// Maps backend StrategicSignal → frontend signal shape consumed by components.
// Backend uses 0.0–1.0 floats; frontend displays 0–100 integers.

const SOURCE_TYPE_MAP = {
  epo_patents: 'Patent',
  competitor_patents: 'Competitor',
  eurlex: 'Regulation',
  competitor_ir: 'Competitor',
  ted_tenders: 'Tender',
  commodities: 'Commodity',
  news_geopolitical: 'Market',
};

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const h = Math.floor(diffMs / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? '1d ago' : `${d}d ago`;
}

export function adaptSignal(s) {
  const { quality_score, benefit_score, timing_score, tech_direction_score } = s.routing_factors;
  const confidence = Math.round(
    ((quality_score + benefit_score + timing_score + tech_direction_score) / 4) * 100
  );

  // reasoning is a single string from the backend; split into bullets for the UI
  const reasoning = s.reasoning
    .split(/\n|(?<=\.)\s+/)
    .map((r) => r.trim())
    .filter(Boolean);

  return {
    id: s.signal_id,
    title: s.title,
    source: s.source,
    type: SOURCE_TYPE_MAP[s.source] || 'Signal',
    timeAgo: timeAgo(s.created_at),
    impact: Math.round(s.ui_metrics.impact * 100),
    confidence,
    recommendation: s.decision,      // BUILD | INVEST | IGNORE
    summary: s.summary,
    reasoning,
    evidence_trail: s.evidence_trail,
    url: s.url,
    tier: s.tier,                     // ACT | TRACK | FILED
    tier_reasoning: s.tier_reasoning,
    ui_metrics: {
      relevance: s.ui_metrics.relevance,
      impact: s.ui_metrics.impact,
      urgency: s.ui_metrics.urgency,
      risk: s.ui_metrics.risk,
      profit_impact: s.ui_metrics.profit_impact,
    },
    routing_factors: s.routing_factors,
    // populated after a tribunal call
    debate: [],
    personaVotes: {},
  };
}

export function adaptSignals(signals) {
  return signals.map(adaptSignal);
}
