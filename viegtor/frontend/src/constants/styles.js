import { Hammer, Target, EyeOff } from 'lucide-react';

export const YELLOW = '#FFCC00';
export const YELLOW_HOVER = '#FFD633';

export const REC_STYLES = {
  BUILD: { bg: YELLOW, text: '#000', icon: Hammer, label: 'BUILD' },
  INVEST: { bg: '#60A5FA', text: '#000', icon: Target, label: 'INVEST' },
  IGNORE: { bg: '#52525b', text: '#fff', icon: EyeOff, label: 'IGNORE' },
};

export const TYPE_COLORS = {
  Competitor: { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  Regulation: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  'Market Buzz': { color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  'M&A': { color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  'Market Trend': { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  Patent: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  Tender: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  Commodity: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  Market: { color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
  Signal: { color: '#71717a', bg: 'rgba(113,113,122,0.1)' },
};
