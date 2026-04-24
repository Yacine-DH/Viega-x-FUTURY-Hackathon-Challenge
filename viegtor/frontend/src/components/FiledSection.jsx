import React from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronRight, Archive } from 'lucide-react';
import { TIER_META } from '../lib/tier';

export default function FiledSection({ signals }) {
  const { color, title } = TIER_META.FIELD;
  const count = signals.length;

  if (count === 0) return null;

  return (
    <Collapsible.Root className="mt-8 border-t border-zinc-800 pt-4">
      <Collapsible.Trigger asChild>
        <button className="group w-full flex items-center justify-between px-1 py-2 text-left hover:bg-zinc-900/40 rounded-md transition">
          <div className="flex items-center gap-2">
            <Archive className="w-3.5 h-3.5" style={{ color }} />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
              {title}
            </span>
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ color, backgroundColor: 'rgba(82,82,91,0.15)' }}
            >
              {count}
            </span>
          </div>
          <ChevronRight
            className="w-4 h-4 text-zinc-500 transition-transform group-data-[state=open]:rotate-90"
          />
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content
        className="overflow-hidden data-[state=open]:animate-[collapseDown_0.25s_ease-out] data-[state=closed]:animate-[collapseUp_0.2s_ease-out]"
      >
        <ul className="mt-2 divide-y divide-zinc-900">
          {signals.map((s) => (
            <li
              key={s.id}
              className="py-2 px-1 flex items-baseline gap-3 text-xs text-zinc-500 hover:text-zinc-300 transition"
            >
              <span className="font-mono text-zinc-600 w-20 flex-shrink-0 truncate">
                {s.source}
              </span>
              <span className="flex-1 truncate">{s.title}</span>
              <span className="text-zinc-700 flex-shrink-0">{s.timeAgo}</span>
            </li>
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
