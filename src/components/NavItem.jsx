import React from 'react';
import { YELLOW } from '../constants/styles';

export default function NavItem({ icon: Icon, label, active, count }) {
  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition"
      style={{
        backgroundColor: active ? '#18181b' : 'transparent',
        color: active ? '#fff' : '#a1a1aa',
      }}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span
          className="px-1.5 py-0.5 rounded font-bold"
          style={{
            fontSize: 10,
            backgroundColor: active ? YELLOW : '#27272a',
            color: active ? '#000' : '#a1a1aa',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
