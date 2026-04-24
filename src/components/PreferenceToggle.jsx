import React from 'react';
import { Sparkles } from 'lucide-react';
import { YELLOW } from '../constants/styles';
import { PREFERENCES } from '../constants/preferences';

export default function PreferenceToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-zinc-500" style={{ fontSize: 11 }}>
        <Sparkles className="w-3 h-3" />
        <span className="uppercase tracking-wider font-semibold">Strategy</span>
      </div>
      <div
        className="flex items-center rounded-lg border p-0.5"
        style={{ borderColor: '#27272a', backgroundColor: '#09090b' }}
      >
        {PREFERENCES.map((p) => {
          const Icon = p.icon;
          const isActive = value === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              title={p.description}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition"
              style={{
                backgroundColor: isActive ? YELLOW : 'transparent',
                color: isActive ? '#000' : '#a1a1aa',
              }}
            >
              <Icon className="w-3 h-3" />
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
