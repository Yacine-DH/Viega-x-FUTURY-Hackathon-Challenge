import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { YELLOW, REC_STYLES, TYPE_COLORS } from '../constants/styles';
import { TIER_META } from '../lib/tier';
import { cn } from '../lib/cn';

export default function SignalCard({ signal, active, onClick, variant = 'act' }) {
  const rec = REC_STYLES[signal.recommendation];
  const RecIcon = rec.icon;
  const typeStyle = TYPE_COLORS[signal.type];
  const tone = TIER_META[variant === 'act' ? 'ACT' : 'TRACK'];
  const isAct = variant === 'act';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border transition-all group relative overflow-hidden',
        isAct ? 'p-5' : 'p-4'
      )}
      style={{
        borderColor: active ? tone.color : '#27272a',
        backgroundColor: active ? '#141417' : '#0c0c0f',
        transform: active ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: active
          ? `0 12px 32px -12px ${tone.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`
          : isAct
            ? `0 0 0 1px rgba(239,68,68,0.08), 0 8px 20px -18px ${tone.glow}`
            : 'none',
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.borderColor = tone.color;
        e.currentTarget.style.backgroundColor = '#131316';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 12px 28px -14px ${tone.glow}`;
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.borderColor = '#27272a';
        e.currentTarget.style.backgroundColor = '#0c0c0f';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isAct
          ? `0 0 0 1px rgba(239,68,68,0.08), 0 8px 20px -18px ${tone.glow}`
          : 'none';
      }}
    >
      {isAct && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: `linear-gradient(to bottom, ${tone.color}, transparent)` }}
        />
      )}

      <div className="flex items-center gap-2 mb-3">
        <span
          className="font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ fontSize: 10, color: typeStyle.color, backgroundColor: typeStyle.bg }}
        >
          {signal.type}
        </span>
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {signal.timeAgo}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: signal.impact > 70 ? tone.color : '#3f3f46' }}
          />
          <span className="text-xs text-zinc-400">Impact {signal.impact}</span>
        </div>
      </div>

      <h3 className={cn('text-white font-medium leading-snug mb-3', isAct ? 'text-base' : 'text-sm')}>
        {signal.title}
      </h3>

      {isAct && (
        <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
          {signal.summary}
        </p>
      )}

      {isAct && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span className="uppercase tracking-wider">Impact</span>
            <span className="font-mono text-zinc-300">{signal.impact}/100</span>
          </div>
          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: signal.impact + '%',
                background: `linear-gradient(to right, ${tone.color}, ${YELLOW})`,
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{signal.source}</span>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all"
          style={{ backgroundColor: rec.bg, color: rec.text }}
        >
          <RecIcon className="w-3 h-3" />
          {rec.label}
        </div>
      </div>

      {isAct && (
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-400 group-hover:text-white transition">
          View decision breakdown
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      )}
    </button>
  );
}
