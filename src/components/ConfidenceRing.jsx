import React from 'react';
import { YELLOW } from '../constants/styles';

export default function ConfidenceRing({ value, size }) {
  const s = size || 100;
  const radius = (s - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative" style={{ width: s, height: s }}>
      <svg width={s} height={s} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={s / 2} cy={s / 2} r={radius} fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx={s / 2}
          cy={s / 2}
          r={radius}
          fill="none"
          stroke={YELLOW}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{value}%</span>
        <span className="uppercase tracking-wider text-zinc-500" style={{ fontSize: 10 }}>Confidence</span>
      </div>
    </div>
  );
}
