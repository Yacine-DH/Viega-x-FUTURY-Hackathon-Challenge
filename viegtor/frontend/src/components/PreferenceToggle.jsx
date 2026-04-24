import React from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as Tooltip from '@radix-ui/react-tooltip';
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
      <Tooltip.Provider delayDuration={200}>
        <ToggleGroup.Root
          type="single"
          value={value}
          onValueChange={(v) => v && onChange(v)}
          className="flex items-center rounded-lg border p-0.5"
          style={{ borderColor: '#27272a', backgroundColor: '#09090b' }}
        >
          {PREFERENCES.map((p) => {
            const Icon = p.icon;
            const isActive = value === p.id;
            return (
              <Tooltip.Root key={p.id}>
                <Tooltip.Trigger asChild>
                  <ToggleGroup.Item
                    value={p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition data-[state=on]:shadow-sm"
                    style={{
                      backgroundColor: isActive ? YELLOW : 'transparent',
                      color: isActive ? '#000' : '#a1a1aa',
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {p.label}
                  </ToggleGroup.Item>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="z-50 max-w-xs px-3 py-2 rounded-lg border text-xs text-zinc-300 leading-relaxed"
                    style={{ borderColor: '#27272a', backgroundColor: '#18181b' }}
                    sideOffset={6}
                  >
                    {p.description}
                    <Tooltip.Arrow style={{ fill: '#18181b' }} />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </ToggleGroup.Root>
      </Tooltip.Provider>
    </div>
  );
}
