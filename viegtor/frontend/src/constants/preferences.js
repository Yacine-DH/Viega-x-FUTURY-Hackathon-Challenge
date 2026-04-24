import { Shield, Scale, Zap } from 'lucide-react';

export const PREFERENCES = [
  { id: 'conservative', label: 'Conservative', icon: Shield, description: 'Prioritize proven bets, high confidence threshold' },
  { id: 'balanced', label: 'Balanced', icon: Scale, description: 'Default AI recommendation' },
  { id: 'aggressive', label: 'Aggressive', icon: Zap, description: 'Escalate opportunities, act on weaker signals' },
];
