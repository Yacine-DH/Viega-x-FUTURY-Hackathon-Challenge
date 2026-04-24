import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Download, Users, Shield, Clock, Activity,
  AlertTriangle, TrendingUp, DollarSign, CheckCircle2, XCircle, MinusCircle,
  Rocket, Beaker, Ban, Globe, FileText, MessageSquare, Clock3,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { YELLOW, REC_STYLES, TYPE_COLORS } from '../constants/styles';
import { SIGNALS } from '../constants/signals';
import Logo from '../components/Logo';
import FeedbackChatBar from '../components/FeedbackChatBar';

const levelLabel = (v) => (v >= 75 ? 'High' : v >= 50 ? 'Medium' : 'Low');
const levelColor = (v) => (v >= 75 ? '#22c55e' : v >= 50 ? '#eab308' : '#ef4444');

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

function ScenarioCard({ kind, signal }) {
  const rec = REC_STYLES[kind];
  const Icon = rec.icon;
  const isBuild = kind === 'BUILD';
  const isInvest = kind === 'INVEST';

  const risk = isBuild
    ? { label: 'High', color: '#ef4444', points: ['High R&D and tooling investment', 'Technical development uncertainty', 'Short-term margin pressure'] }
    : isInvest
      ? { label: 'Medium', color: '#eab308', points: ['May be too slow if market moves fast', 'Competitor could strengthen position', 'Limited learning if passive'] }
      : { label: 'High', color: '#ef4444', points: ['Lose market share over time', 'Seen as late follower', 'Erodes competitive position'] };

  const potential = isBuild
    ? { label: 'Very High', points: ['Maintain market leadership', 'Win installer loyalty', 'Set new standard in the market'] }
    : isInvest
      ? { label: 'Medium', points: ['Learn more with limited risk', 'Build optionality', 'Enable future quick move'] }
      : { label: 'Low', points: ['Focus resources on other priorities', 'Short-term cost savings', 'Avoids execution risk'] };

  const profit = isBuild
    ? { label: 'Very High', points: ['High revenue upside', 'Long-term competitive advantage', 'Strengthens brand positioning'] }
    : isInvest
      ? { label: 'Medium', points: ['Moderate upside', 'Flexibility to pivot or scale', 'Lower short-term return'] }
      : { label: 'Low', points: ['Low / negative long-term impact', 'Opportunity cost high', 'Risk of obsolescence'] };

  const actions = isBuild
    ? ['Start product teardown & benchmarking (0–1M)', 'Define requirements & build concept (1–3M)', 'Develop MVP & test with pilot installers (3–6M)', 'Plan launch & go-to-market (6–12M)']
    : isInvest
      ? ['Deep dive market & customer validation (0–3M)', 'Engage key installers & gather feedback (1–3M)', 'Monitor competitor & technology (continuous)', 'Develop business case (3–6M)']
      : ['No active development', 'Keep monitoring signals', 'Re-evaluate in 6–12 months'];

  const actIcon = isBuild ? CheckCircle2 : isInvest ? MinusCircle : XCircle;
  const ActIcon = actIcon;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: '#0f0f12',
        borderColor: rec.bg === YELLOW ? 'rgba(255,204,0,0.3)' : rec.bg + '40',
      }}
    >
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm mb-3"
        style={{ backgroundColor: rec.bg, color: rec.text }}
      >
        <Icon className="w-4 h-4" />
        {rec.label}
      </div>
      <div className="text-xs text-zinc-400 mb-5">
        {isBuild ? 'Act now and develop a competing solution' : isInvest ? "Explore and prepare, but don't commit fully" : 'Do not act at this time'}
      </div>

      <Block icon={AlertTriangle} title="Risk" score={risk.label} color={risk.color} points={risk.points} />
      <Block icon={TrendingUp} title="Potential" score={potential.label} color="#22c55e" points={potential.points} />
      <Block icon={DollarSign} title="Profit / Impact" score={profit.label} color="#22c55e" points={profit.points} />

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Action Points</div>
        <ul className="space-y-1.5">
          {actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
              <ActIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: rec.bg === YELLOW ? YELLOW : rec.bg }} />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Block({ icon: Icon, title, score, color, points }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs font-semibold text-white">{title}</span>
        </div>
        <span className="text-xs font-bold" style={{ color }}>{score}</span>
      </div>
      <ul className="space-y-0.5 pl-5">
        {points.map((p, i) => (
          <li key={i} className="text-xs text-zinc-400 list-disc">{p}</li>
        ))}
      </ul>
    </div>
  );
}

export default function TrendDetailPage({ signal, onBack }) {
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

  const sources = [
    { label: signal.source, sub: signal.type, ago: signal.timeAgo },
    { label: 'Industry Report', sub: 'Market brief', ago: '1d ago' },
    { label: 'Company Website', sub: 'Press release', ago: '3h ago' },
  ];

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
            <p className="text-sm text-zinc-300 leading-relaxed">{signal.summary}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 p-4" style={{ backgroundColor: '#0f0f12' }}>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4" style={{ color: YELLOW }} />
              <div className="text-xs uppercase tracking-wider text-zinc-500">Sources</div>
            </div>
            <ul className="space-y-3">
              {sources.map((s, i) => (
                <li key={i} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-white">{s.label}</div>
                    <div className="text-xs text-zinc-500">{s.sub}</div>
                  </div>
                  <span className="text-xs text-zinc-500 flex-shrink-0">{s.ago}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-800 p-4" style={{ backgroundColor: '#0f0f12' }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4" style={{ color: YELLOW }} />
              <div className="text-xs uppercase tracking-wider text-zinc-500">Extracted Facts</div>
            </div>
            <ul className="space-y-2">
              {signal.reasoning.map((r, i) => (
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
              <div className="text-xs text-zinc-500 mb-3">Weighted Score</div>
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
                  <span className="text-xs">⭐</span>
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

          <div className="grid grid-cols-3 gap-3">
            <ScenarioCard kind="BUILD" signal={signal} />
            <ScenarioCard kind="INVEST" signal={signal} />
            <ScenarioCard kind="IGNORE" signal={signal} />
          </div>

          <div className="rounded-2xl border border-zinc-800 p-5 flex items-start gap-6" style={{ backgroundColor: '#0f0f12' }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-bold">Why?</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {signal.reasoning.join('. ')}.
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-zinc-800">
              <Users className="w-4 h-4 text-zinc-400" />
              <div>
                <div className="text-xs text-zinc-500">Stakeholder alignment</div>
                <div className="text-sm font-bold" style={{ color: levelColor(signal.confidence) }}>
                  {levelLabel(signal.confidence)}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-4 z-40" style={{ left: 24, width: Math.max(260, inputsWidth) }}>
        <FeedbackChatBar signals={SIGNALS} initialAttachedId={signal.id} lockAttachment />
      </div>
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
