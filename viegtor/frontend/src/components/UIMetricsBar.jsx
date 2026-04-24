import React from 'react';
import { YELLOW } from '../constants/styles';

const METRICS = [
  { key: 'impact', label: 'Impact', color: YELLOW },
  { key: 'urgency', label: 'Urgency', color: '#F97316' },
  { key: 'relevance', label: 'Relevance', color: '#60A5FA' },
  { key: 'profit_impact', label: 'Profit', color: '#34D399' },
  { key: 'risk', label: 'Risk', color: '#F87171' },
];

export default function UIMetricsBar({ metrics }) {
  if (!metrics) return null;
  return (
    <div className="space-y-2">
      {METRICS.map(({ key, label, color }) => {
        const pct = Math.round((metrics[key] ?? 0) * 100);
        return (
          <div key={key} className="flex items-center gap-3">
            <div className="text-zinc-500 w-14 flex-shrink-0 text-right" style={{ fontSize: 10 }}>
              {label}
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <div className="text-zinc-400 w-7 text-right" style={{ fontSize: 10 }}>
              {pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
