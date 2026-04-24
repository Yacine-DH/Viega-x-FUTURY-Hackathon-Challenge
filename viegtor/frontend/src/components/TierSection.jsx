import React from 'react';
import { Flame, Eye } from 'lucide-react';
import { TIER_META } from '../lib/tier';
import { cn } from '../lib/cn';
import SignalCard from './SignalCard';

const ICONS = { ACT: Flame, TRACK: Eye };

export default function TierSection({ tier, signals, preference, onCardClick, activeId }) {
  const meta = TIER_META[tier];
  const count = signals.length;
  const Icon = ICONS[tier];
  const variant = tier === 'ACT' ? 'act' : 'track';
  const gridCols = tier === 'ACT'
    ? 'grid-cols-1 md:grid-cols-2'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  if (count === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ backgroundColor: meta.color + '15', border: `1px solid ${meta.color}40` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
          {meta.title}
        </h3>
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{ color: meta.color, backgroundColor: meta.color + '15' }}
        >
          {count}
        </span>
        <div className="flex-1 h-px ml-3" style={{ background: `linear-gradient(to right, ${meta.color}40, transparent)` }} />
      </div>

      <div className={cn('grid gap-3', gridCols)}>
        {signals.map((s) => (
          <SignalCard
            key={s.id}
            signal={s}
            active={activeId === s.id}
            preference={preference}
            onClick={() => onCardClick(s.id)}
            variant={variant}
          />
        ))}
      </div>
    </section>
  );
}
