import { Cpu, Wrench, Gauge, Shield, Leaf } from 'lucide-react';

export const PERSONAS = {
  david: { id: 'david', name: 'David', role: 'Digital Innovator', icon: Cpu, color: '#60A5FA', tagline: 'The future is connected.' },
  josef: { id: 'josef', name: 'Josef', role: 'Loyal Traditionalist', icon: Wrench, color: '#F97316', tagline: 'Proven engineering wins.' },
  steffen: { id: 'steffen', name: 'Steffen', role: 'Efficiency Seeker', icon: Gauge, color: '#34D399', tagline: 'Every minute on site counts.' },
  volkmar: { id: 'volkmar', name: 'Volkmar', role: 'Cautious Follower', icon: Shield, color: '#A78BFA', tagline: 'Wait for market proof first.' },
  nick: { id: 'nick', name: 'Nick', role: 'Sustainable Companion', icon: Leaf, color: '#6EE7B7', tagline: 'ESG alignment is non-negotiable.' },
};

// The three personas toggleable from the sidebar
export const SIDEBAR_PERSONA_IDS = ['david', 'josef', 'steffen'];
