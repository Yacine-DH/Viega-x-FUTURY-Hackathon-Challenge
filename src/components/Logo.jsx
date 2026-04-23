import React from 'react';
import { Compass } from 'lucide-react';
import { YELLOW } from '../constants/styles';

export default function Logo({ size = 28 }) {
  const fontSize = size;
  const iconSize = size * 1.05;
  return (
    <div className="flex items-center" style={{ lineHeight: 1 }}>
      <span
        className="font-extrabold tracking-tight"
        style={{ color: YELLOW, fontSize, letterSpacing: '-0.02em' }}
      >
        viegt
      </span>
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: iconSize, height: iconSize, marginLeft: -2, marginRight: -2 }}
      >
        <Compass style={{ width: iconSize, height: iconSize, color: YELLOW }} strokeWidth={2.2} />
      </span>
      <span
        className="font-extrabold tracking-tight"
        style={{ color: YELLOW, fontSize, letterSpacing: '-0.02em' }}
      >
        r
      </span>
    </div>
  );
}
