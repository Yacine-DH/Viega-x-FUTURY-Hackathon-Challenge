import React, { useState } from 'react';
import { Compass } from 'lucide-react';
import { YELLOW } from '../constants/styles';
import { FOCUS_OPTIONS } from '../constants/focusOptions';

export default function Onboarding({ onComplete }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: YELLOW }}>
            <Compass className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Viega Intelligent Compass</h1>
            <p className="text-xs text-zinc-500">Futury x Viega 2026</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mt-6 mb-2">Customize your Compass</h2>
        <p className="text-zinc-400 mb-6">What is your primary strategic focus today?</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FOCUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSel = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className="group relative text-left p-5 rounded-xl border-2 transition-all"
                style={{
                  borderColor: isSel ? YELLOW : '#27272a',
                  backgroundColor: isSel ? 'rgba(255,204,0,0.05)' : '#09090b',
                }}
              >
                <Icon className="w-6 h-6 mb-3 transition-colors" style={{ color: isSel ? YELLOW : '#a1a1aa' }} />
                <div className={`font-semibold mb-1 ${isSel ? 'text-white' : 'text-zinc-200'}`}>{opt.label}</div>
                <div className="text-xs text-zinc-500 leading-relaxed">{opt.description}</div>
                {isSel && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: YELLOW }} />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => selected && onComplete(selected)}
          disabled={!selected}
          className="mt-6 w-full py-3 rounded-xl font-semibold transition-all"
          style={{
            backgroundColor: selected ? YELLOW : '#27272a',
            color: selected ? '#000' : '#71717a',
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          Calibrate Compass
        </button>
      </div>
    </div>
  );
}
