import React from 'react';
import { YELLOW } from '../constants/styles';

export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div
      className="p-6 rounded-2xl border border-zinc-800 transition-all"
      style={{ backgroundColor: '#09090b' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3f3f46'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.2)' }}
      >
        <Icon className="w-5 h-5" style={{ color: YELLOW }} />
      </div>
      <h3 className="font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
