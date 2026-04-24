import React from 'react';
import { YELLOW } from '../constants/styles';

export default function StatCard({ value, label }) {
  return (
    <div className="p-5 rounded-xl border border-zinc-800" style={{ backgroundColor: '#09090b' }}>
      <div className="text-3xl font-bold" style={{ color: YELLOW }}>{value}</div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
