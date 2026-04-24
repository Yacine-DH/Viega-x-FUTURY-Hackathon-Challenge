import React from 'react';
import { Clock } from 'lucide-react';
import { YELLOW, REC_STYLES, TYPE_COLORS } from '../constants/styles';
import { applyPreference } from '../lib/preference';

export default function SignalCard({ signal, active, preference, onClick }) {
  const adjustedRec = applyPreference(signal, preference);
  const rec = REC_STYLES[adjustedRec];
  const RecIcon = rec.icon;
  const typeStyle = TYPE_COLORS[signal.type];
  const shifted = adjustedRec !== signal.recommendation;
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border transition-all group cursor-pointer"
      style={{
        borderColor: active ? YELLOW : '#27272a',
        backgroundColor: active ? '#18181b' : '#09090b',
        transform: active ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: active ? '0 8px 24px -12px rgba(255,204,0,0.35)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.borderColor = '#3f3f46';
        e.currentTarget.style.backgroundColor = '#131316';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.borderColor = '#27272a';
        e.currentTarget.style.backgroundColor = '#09090b';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
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
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: signal.impact > 70 ? YELLOW : '#3f3f46' }} />
          <span className="text-xs text-zinc-400">Impact {signal.impact}</span>
        </div>
      </div>
      <h3 className="text-white font-medium leading-snug mb-3">{signal.title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{signal.source}</span>
        <div className="flex items-center gap-2">
          {shifted && (
            <span className="text-zinc-500" style={{ fontSize: 10 }} title={`Shifted from ${signal.recommendation}`}>
              · was {signal.recommendation}
            </span>
          )}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all"
            style={{ backgroundColor: rec.bg, color: rec.text }}
          >
            <RecIcon className="w-3 h-3" />
            {rec.label}
          </div>
        </div>
      </div>
    </button>
  );
}
