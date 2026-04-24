import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Download, Users, Shield, Clock, Activity,
  AlertTriangle, TrendingUp, DollarSign, CheckCircle2, XCircle, MinusCircle,
  Globe, FileText, MessageSquare, Clock3, Sparkles, ExternalLink, Target,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { YELLOW, REC_STYLES, TYPE_COLORS } from '../constants/styles';
import Logo from '../components/Logo';
import FeedbackChatBar from '../components/FeedbackChatBar';
import DebateModal from '../components/DebateModal';

const levelLabel = (v) => (v >= 75 ? 'High' : v >= 50 ? 'Medium' : 'Low');
const levelColor = (v) => (v >= 75 ? '#22c55e' : v >= 50 ? '#eab308' : '#ef4444');

// strip "(weighted benefit=0.80, quality=0.95)" / "(CAGR 19%)" kept / numeric score refs
const cleanText = (s) => {
  if (!s) return '';
  return s
    .replace(/\s*\(weighted[^)]*\)/gi, '')
    .replace(/\s*\([^)]*(?:weight|score|coefficient)[^)]*\)/gi, '')
    .replace(/\b(?:weighted\s+)?(?:benefit|quality|impact|urgency|risk|confidence)\s*=\s*[\d.]+\s*,?\s*/gi, '')
    .replace(/\.\./g, '.')
    .trim();
};

const SOURCE_NAMES = {
  competitor_ir: 'Competitor IR',
  epo_patents: 'EPO Patent Registry',
  eurlex: 'EUR-Lex',
  ted_tenders: 'TED Tenders',
  commodities: 'Commodities Market',
  news: 'Industry News',
};
const sourceLabel = (s) => SOURCE_NAMES[s] || s || 'Source';

function Bar({ label, value }) {
  const lbl = levelLabel(value);
  const color = levelColor(value);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>{lbl}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, subtitle, metrics, accent }) {
  const avg = Math.round(metrics.reduce((a, b) => a + b.value, 0) / metrics.length);
  const overall = levelLabel(avg);
  return (
    <div className="rounded-2xl border border-zinc-800 p-3.5" style={{ backgroundColor: '#0f0f12' }}>
      <div className="flex items-start gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent + '20', border: `1px solid ${accent}40` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <div>
          <div className="font-semibold text-white text-sm leading-tight">{title}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{subtitle}</div>
        </div>
      </div>
      <div className="space-y-2">
        {metrics.map((m) => <Bar key={m.label} label={m.label} value={m.value} />)}
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800">
        <span className="text-xs uppercase tracking-wider text-zinc-500">Overall</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{ color: levelColor(avg), backgroundColor: levelColor(avg) + '20' }}
        >
          {overall}
        </span>
      </div>
    </div>
  );
}

// richer narrative per decision — contextual to signal type
function scenarioNarrative(kind, signal) {
  const typ = signal.type || 'this signal';
  const isComp = signal.type === 'Competitor' || signal.type === 'Patent';
  const isReg = signal.type === 'Regulation';

  if (kind === 'BUILD') {
    return {
      tagline: 'Move first. Own the category before the window closes.',
      why: isComp
        ? `A direct competitor is staking a claim on ${typ.toLowerCase()} territory. Building now protects installer loyalty and locks in IP before the category hardens.`
        : isReg
          ? `Regulation sets a hard floor everyone must meet. Building ahead of the deadline turns compliance into a commercial advantage.`
          : `The signal points to an unmet need. First-mover execution compounds — every month of delay widens the gap a follower must close.`,
      risk: {
        label: 'High',
        summary: 'Real capital exposure and execution uncertainty — but bounded and known.',
        points: [
          'R&D and tooling investment sunk before revenue',
          'Technical unknowns until first pilot installs',
          'Short-term margin pressure during ramp-up',
        ],
      },
      potential: {
        label: 'Very High',
        summary: 'The upside is not linear — first-mover compounds through specifier lock-in and installed base.',
        points: [
          'Category leadership and brand authority',
          'Installer loyalty — hardest moat to copy',
          'Defensible IP position blocks fast followers',
        ],
      },
      profit: {
        label: 'Very High',
        summary: 'Revenue tied to a growing TAM with premium pricing power while competitors play catch-up.',
        points: [
          'Premium margin window of 18–24 months',
          'Aftermarket and service attach opportunities',
          'Long-tail spec-in revenue on new builds',
        ],
      },
      actions: [
        'Teardown & benchmarking vs. competitor filing (0–1M)',
        'Concept definition + tooling compatibility check (1–3M)',
        'MVP + pilot installers in 2–3 EU markets (3–6M)',
        'Full launch + spec-in campaign with wholesalers (6–12M)',
      ],
    };
  }
  if (kind === 'INVEST') {
    return {
      tagline: 'Buy optionality. Validate before committing full capital.',
      why: `Evidence is meaningful but not yet conclusive. A scoped investment keeps the door open while the market declares itself — cheaper than being wrong at full scale.`,
      risk: {
        label: 'Medium',
        summary: 'Moderate financial exposure; the main risk is moving too slowly if the signal hardens.',
        points: [
          'Could arrive late if competitor accelerates',
          'Limited learning if team stays too passive',
          'Diluted focus across exploration and core roadmap',
        ],
      },
      potential: {
        label: 'Medium',
        summary: 'Real knowledge gain + preserved optionality to scale up without a cold start.',
        points: [
          'Direct installer and specifier feedback',
          'De-risked business case for a later BUILD',
          'Early partnerships before they get locked',
        ],
      },
      profit: {
        label: 'Medium',
        summary: 'Modest near-term return; the payoff is a faster, cheaper BUILD if conviction grows.',
        points: [
          'Lower capex, preserved flexibility',
          'Pivot cost stays small',
          'Upside capped unless escalated',
        ],
      },
      actions: [
        'Market sizing + customer discovery (0–3M)',
        'Installer / specifier interview panel (1–3M)',
        'Continuous competitor and tech monitoring',
        'Go / no-go decision gate at month 6',
      ],
    };
  }
  return {
    tagline: 'Hold. Keep watching — but understand the cost of being wrong.',
    why: `Resources are finite. If this signal is weak or outside strategic focus, standing down preserves budget for higher-conviction bets. The trade-off: if it hardens, re-entry is expensive.`,
    risk: {
      label: 'High',
      summary: 'Inaction is not free — opportunity cost and perception risk compound quarter over quarter.',
      points: [
        'Market share erosion if signal proves real',
        'Perceived as late follower by specifiers',
        'Re-entry cost rises with every quarter',
      ],
    },
    potential: {
      label: 'Low',
      summary: 'Upside is purely cost-savings and focus — real only if the signal stays weak.',
      points: [
        'Capital freed for higher-priority bets',
        'Short-term cost and headcount savings',
        'Avoids execution risk on a weak hypothesis',
      ],
    },
    profit: {
      label: 'Low',
      summary: 'Neutral to negative long-term — zero upside from this signal; pure defense.',
      points: [
        'No revenue upside from this signal',
        'Opportunity cost grows if market hardens',
        'Risk of obsolescence in adjacent categories',
      ],
    },
    actions: [
      'No active development',
      'Monitor signal quarterly for acceleration',
      'Auto-escalate if competitor or regulation intensifies',
      'Re-evaluate decision gate in 6–12 months',
    ],
  };
}

function ArgumentBlock({ icon: Icon, title, score, color, summary, points }) {
  return (
    <div className="mb-3 rounded-xl border border-zinc-800 p-3" style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs font-semibold text-white">{title}</span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ color, backgroundColor: color + '20' }}
        >
          {score}
        </span>
      </div>
      <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">{summary}</p>
      <ul className="space-y-1">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
            <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScenarioCard({ kind, signal, recommended }) {
  const rec = REC_STYLES[kind];
  const Icon = rec.icon;
  const n = scenarioNarrative(kind, signal);
  const riskColor = n.risk.label === 'Low' ? '#22c55e' : n.risk.label === 'Medium' ? '#eab308' : '#ef4444';
  const potColor = n.potential.label === 'Very High' || n.potential.label === 'High' ? '#22c55e' : n.potential.label === 'Medium' ? '#eab308' : '#71717a';
  const profColor = n.profit.label === 'Very High' || n.profit.label === 'High' ? '#22c55e' : n.profit.label === 'Medium' ? '#eab308' : '#71717a';
  const ActIcon = kind === 'BUILD' ? CheckCircle2 : kind === 'INVEST' ? MinusCircle : XCircle;
  const borderCol = recommended
    ? (kind === 'BUILD' ? 'rgba(255,204,0,0.5)' : rec.bg)
    : '#27272a';

  return (
    <div
      className="relative rounded-2xl border p-5 transition"
      style={{
        backgroundColor: '#0f0f12',
        borderColor: borderCol,
        boxShadow: recommended ? `0 0 40px -12px ${kind === 'BUILD' ? 'rgba(255,204,0,0.4)' : rec.bg + '60'}` : 'none',
      }}
    >
      {recommended && (
        <div
          className="absolute -top-2.5 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: YELLOW, color: '#000' }}
        >
          <Sparkles className="w-3 h-3" />
          AI Pick
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm"
          style={{ backgroundColor: rec.bg, color: rec.text }}
        >
          <Icon className="w-4 h-4" />
          {rec.label}
        </div>
      </div>
      <div className="text-xs font-semibold text-white mb-1.5">{n.tagline}</div>
      <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">{n.why}</p>

      <ArgumentBlock icon={AlertTriangle} title="Risk" score={n.risk.label} color={riskColor} summary={n.risk.summary} points={n.risk.points} />
      <ArgumentBlock icon={TrendingUp} title="Potential" score={n.potential.label} color={potColor} summary={n.potential.summary} points={n.potential.points} />
      <ArgumentBlock icon={DollarSign} title="Profit / Impact" score={n.profit.label} color={profColor} summary={n.profit.summary} points={n.profit.points} />

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Action Path</div>
        <ul className="space-y-1.5">
          {n.actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
              <ActIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: kind === 'BUILD' ? YELLOW : rec.bg }} />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function TrendDetailPage({ signal, onBack }) {
  const [showTribunal, setShowTribunal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)));
  const zoomReset = () => setZoom(1);
  const [inputsWidth, setInputsWidth] = useState(320);
  const [dragging, setDragging] = useState(false);
  const onDrag = useCallback((e) => {
    setInputsWidth((w) => Math.min(560, Math.max(220, e.clientX - 24)));
  }, []);
  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, onDrag]);

  const score = Math.round((signal.impact + signal.confidence) / 2);
  const typeStyle = TYPE_COLORS[signal.type] || { color: '#a1a1aa', bg: 'rgba(161,161,170,0.1)' };
  const rec = REC_STYLES[signal.recommendation];
  const RecIcon = rec.icon;

  const facts = (signal.reasoning || []).map(cleanText).filter(Boolean);
  const whyText = cleanText(signal.summary) || facts.join('. ');
  const whyPoints = facts.length ? facts : [whyText];

  const primarySource = {
    label: sourceLabel(signal.source),
    url: signal.url || null,
    ago: signal.timeAgo,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-zinc-800" style={{ backgroundColor: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button onClick={onBack} className="flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-zinc-900 transition" title="Back to dashboard">
              <Logo size={22} />
              <div className="font-bold text-white text-sm">Viega <span className="text-zinc-400 font-normal">Decision Intelligence</span></div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-300"
              style={{ backgroundColor: '#18181b' }}
            >
              Scenario: <span className="text-white font-semibold">{signal.type}</span>
            </div>
            <div className="flex items-center gap-1 mx-1 px-1 py-0.5 rounded-lg border border-zinc-800" style={{ backgroundColor: '#0f0f12' }}>
              <button onClick={zoomOut} className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800" title="Zoom out"><ZoomOut className="w-3.5 h-3.5" /></button>
              <button onClick={zoomReset} className="px-1.5 text-[11px] font-mono text-zinc-400 hover:text-white" title="Reset zoom">{Math.round(zoom * 100)}%</button>
              <button onClick={zoomIn} className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800" title="Zoom in"><ZoomIn className="w-3.5 h-3.5" /></button>
            </div>
            <button
              onClick={() => setShowTribunal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition"
              style={{ borderColor: 'rgba(255,204,0,0.4)', backgroundColor: 'rgba(255,204,0,0.08)', color: YELLOW }}
            >
              <MessageSquare className="w-4 h-4" />
              Summon Tribunal
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-sm text-zinc-300 hover:text-white hover:border-zinc-700">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-5 flex gap-4" style={{ zoom }}>
        <aside className="space-y-4 flex-shrink-0" style={{ width: inputsWidth }}>
          <SectionTitle num={1} title="INPUTS" sub="What is happening?" />

          <div className="rounded-2xl border border-zinc-800 p-4" style={{ backgroundColor: '#0f0f12' }}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" style={{ color: YELLOW }} />
              <div className="text-xs uppercase tracking-wider text-zinc-500">Signal Summary</div>
            </div>
            <div className="font-bold text-white mb-2">{signal.type}</div>
            <p className="text-sm text-zinc-300 leading-relaxed">{cleanText(signal.summary)}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 p-4" style={{ backgroundColor: '#0f0f12' }}>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4" style={{ color: YELLOW }} />
              <div className="text-xs uppercase tracking-wider text-zinc-500">Source</div>
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white mb-0.5">{primarySource.label}</div>
                {primarySource.url ? (
                  <a
                    href={primarySource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white break-all"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{primarySource.url}</span>
                  </a>
                ) : (
                  <div className="text-xs text-zinc-500">Link unavailable</div>
                )}
              </div>
              <span className="text-xs text-zinc-500 flex-shrink-0">{primarySource.ago}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 p-4" style={{ backgroundColor: '#0f0f12' }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4" style={{ color: YELLOW }} />
              <div className="text-xs uppercase tracking-wider text-zinc-500">Extracted Facts</div>
            </div>
            <ul className="space-y-2">
              {facts.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: YELLOW }} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-800 p-4" style={{ backgroundColor: '#0f0f12' }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock3 className="w-4 h-4" style={{ color: YELLOW }} />
              <div className="text-xs uppercase tracking-wider text-zinc-500">Time Detected</div>
            </div>
            <div className="text-sm text-zinc-300">{signal.timeAgo}</div>
          </div>
        </aside>

        <div
          onMouseDown={() => setDragging(true)}
          className="w-1 cursor-col-resize flex-shrink-0 hover:bg-yellow-400/40 transition rounded"
          style={{ backgroundColor: dragging ? 'rgba(255,204,0,0.5)' : 'transparent' }}
          title="Drag to resize"
        />
        <section className="flex-1 space-y-4 min-w-0">
          <SectionTitle num={2} title="THINKING / ANALYSIS" sub="How we think about it" />

          <div className="grid grid-cols-5 gap-3">
            <MetricCard
              icon={Users}
              title="Relevance"
              subtitle="How relevant is this for Viega?"
              accent="#60a5fa"
              metrics={[
                { label: 'Customer Relevance', value: signal.impact },
                { label: 'Product Category Fit', value: Math.min(95, signal.impact + 5) },
              ]}
            />
            <MetricCard
              icon={Shield}
              title="Competitive Impact"
              subtitle="What is the competitive threat?"
              accent="#a78bfa"
              metrics={[
                { label: 'Risk of Market Share Loss', value: signal.impact },
                { label: 'Barrier to Imitate', value: Math.max(40, signal.confidence - 15) },
              ]}
            />
            <MetricCard
              icon={Clock}
              title="Urgency"
              subtitle="How urgent is action needed?"
              accent="#fb923c"
              metrics={[
                { label: 'Time to Market Effect', value: signal.impact },
                { label: 'Window of Opportunity', value: Math.max(45, signal.confidence - 10) },
              ]}
            />
            <MetricCard
              icon={Activity}
              title="Confidence"
              subtitle="How strong is the signal?"
              accent="#34d399"
              metrics={[
                { label: 'Source Reliability', value: signal.confidence },
                { label: 'Evidence Strength', value: Math.max(50, signal.confidence - 5) },
              ]}
            />

            <div className="rounded-2xl border border-zinc-800 p-5 flex flex-col" style={{ backgroundColor: '#0f0f12' }}>
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Overall Assessment</div>
              <div className="text-xs text-zinc-500 mb-3">Combined priority</div>
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#27272a" strokeWidth="8" fill="none" />
                    <circle
                      cx="56" cy="56" r="48"
                      stroke={levelColor(score)} strokeWidth="8" fill="none"
                      strokeDasharray={`${(score / 100) * 301.6} 301.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{score}</span>
                    <span className="text-xs text-zinc-500">/100</span>
                  </div>
                </div>
              </div>
              <div
                className="text-center text-xs font-bold py-1 rounded mt-2"
                style={{ backgroundColor: levelColor(score) + '20', color: levelColor(score) }}
              >
                {score >= 75 ? 'HIGH PRIORITY' : score >= 50 ? 'MEDIUM PRIORITY' : 'LOW PRIORITY'}
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3 h-3" style={{ color: YELLOW }} />
                  <span className="text-xs font-semibold text-white">AI Recommendation</span>
                </div>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-sm mb-2"
                  style={{ backgroundColor: rec.bg, color: rec.text }}
                >
                  <RecIcon className="w-4 h-4" />
                  {rec.label}
                </div>
                <div className="text-xs text-zinc-400 leading-snug">
                  {signal.recommendation === 'BUILD'
                    ? 'Strong case for building a competing / superior solution.'
                    : signal.recommendation === 'INVEST'
                      ? 'Explore opportunity with measured investment.'
                      : 'Low priority — monitor but do not act.'}
                </div>
              </div>
            </div>
          </div>

          <SectionTitle num={3} title="DECISION & SCENARIOS" sub="What are our options and the consequences?" />

          <div className="grid grid-cols-3 gap-3 items-start">
            <ScenarioCard kind="BUILD" signal={signal} recommended={signal.recommendation === 'BUILD'} />
            <ScenarioCard kind="INVEST" signal={signal} recommended={signal.recommendation === 'INVEST'} />
            <ScenarioCard kind="IGNORE" signal={signal} recommended={signal.recommendation === 'IGNORE'} />
          </div>

          <div className="rounded-2xl border border-zinc-800 p-5" style={{ backgroundColor: '#0f0f12' }}>
            <div className="flex items-start justify-between gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,204,0,0.12)', border: '1px solid rgba(255,204,0,0.3)' }}
                >
                  <Target className="w-4 h-4" style={{ color: YELLOW }} />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Why this decision</div>
                  <div className="text-xs text-zinc-500">Key reasoning behind the recommendation</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-zinc-800 flex-shrink-0">
                <Users className="w-4 h-4 text-zinc-400" />
                <div>
                  <div className="text-xs text-zinc-500">Stakeholder alignment</div>
                  <div className="text-sm font-bold" style={{ color: levelColor(signal.confidence) }}>
                    {levelLabel(signal.confidence)}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {whyPoints.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800"
                  style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,204,0,0.15)', color: YELLOW }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-4 z-40" style={{ left: 24, width: Math.max(260, inputsWidth) }}>
        <FeedbackChatBar signals={[signal]} initialAttachedId={signal.id} lockAttachment />
      </div>

      {showTribunal && (
        <DebateModal signal={signal} onClose={() => setShowTribunal(false)} />
      )}
    </div>
  );
}

function SectionTitle({ num, title, sub }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs"
        style={{ backgroundColor: YELLOW, color: '#000' }}
      >
        {num}
      </div>
      <div className="font-bold text-white tracking-wide">{title}</div>
      <div className="text-xs text-zinc-500">{sub}</div>
    </div>
  );
}
