import React, { useState } from 'react';
import {
  Compass, Radar, MessageSquare, Sparkles, TrendingUp, Activity,
  Bell, Search, Settings, LogOut, Filter, ChevronRight, ExternalLink, X,
} from 'lucide-react';
import { YELLOW, YELLOW_HOVER, REC_STYLES } from '../constants/styles';
import { PERSONAS } from '../constants/personas';
import { SIGNALS } from '../constants/signals';
import { FOCUS_OPTIONS } from '../constants/focusOptions';
import { applyPreference, getConfidenceAdjusted, signalBaseline } from '../lib/preference';
import ConfidenceRing from '../components/ConfidenceRing';
import NavItem from '../components/NavItem';
import PreferenceToggle from '../components/PreferenceToggle';
import SignalCard from '../components/SignalCard';
import DebateModal from '../components/DebateModal';
import Onboarding from '../components/Onboarding';
import Logo from '../components/Logo';

export default function Dashboard({ onSignOut }) {
  const [onboarded, setOnboarded] = useState(false);
  const [focus, setFocus] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [debateOpen, setDebateOpen] = useState(false);
  const [activePersonas, setActivePersonas] = useState({ david: true, josef: true, steffen: true });
  const [typeFilter, setTypeFilter] = useState('All');
  const [preference, setPreference] = useState('balanced');

  const handleOnboarding = (focusId) => {
    setFocus(focusId);
    if (focusId === 'digital') setActivePersonas({ david: true, josef: false, steffen: true });
    else if (focusId === 'reliability') setActivePersonas({ david: false, josef: true, steffen: true });
    else setActivePersonas({ david: true, josef: true, steffen: true });
    setOnboarded(true);
  };

  const selected = SIGNALS.find((s) => s.id === selectedId);
  const types = ['All'].concat(Array.from(new Set(SIGNALS.map((s) => s.type))));
  const filteredSignals = typeFilter === 'All' ? SIGNALS : SIGNALS.filter((s) => s.type === typeFilter);

  const togglePersona = (id) => {
    setActivePersonas((p) => {
      const next = Object.assign({}, p);
      next[id] = !p[id];
      return next;
    });
  };

  const adjustedRec = selected ? applyPreference(selected, preference) : null;
  const adjustedConf = selected ? getConfidenceAdjusted(selected, preference) : 0;
  const shifted = selected && adjustedRec !== selected.recommendation;
  const rec = adjustedRec ? REC_STYLES[adjustedRec] : null;
  const RecIcon = rec ? rec.icon : null;

  const buildCount = SIGNALS.filter((s) => applyPreference(s, preference) === 'BUILD').length;
  const activeCount = Object.values(activePersonas).filter(Boolean).length;
  const focusLabel = FOCUS_OPTIONS.find((f) => f.id === focus);

  return (
    <div className="min-h-screen bg-zinc-950 text-white" style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
      {!onboarded && <Onboarding onComplete={handleOnboarding} />}

      <header
        className="sticky top-0 z-30"
        style={{ backgroundColor: 'transparent' }}
      >
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <div className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: 10 }}>
              Focus - {focusLabel ? focusLabel.label : 'Unset'}
            </div>
          </div>

          <PreferenceToggle value={preference} onChange={setPreference} />

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 text-zinc-500" style={{ transform: 'translateY(-50%)' }} />
              <input
                placeholder="Search signals..."
                className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-sm w-52 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: YELLOW }} />
            </button>
            <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900">
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12" style={{ height: 'calc(100vh - 57px)' }}>
        <aside className="col-span-3 border-r border-zinc-800 overflow-y-auto p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Navigation</div>
          <nav className="space-y-1 mb-8">
            <NavItem icon={Radar} label="Radar" active count={SIGNALS.length} />
            <NavItem icon={Activity} label="Decisions" count={3} />
            <NavItem icon={TrendingUp} label="Trends" />
            <NavItem icon={Sparkles} label="AI Insights" />
          </nav>

          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">AI Personas</div>
            <span className="text-zinc-600" style={{ fontSize: 10 }}>{activeCount}/3 active</span>
          </div>
          <div className="space-y-2">
            {Object.values(PERSONAS).map((p) => {
              const Icon = p.icon;
              const isActive = activePersonas[p.id];
              return (
                <button
                  key={p.id}
                  onClick={() => togglePersona(p.id)}
                  className="w-full text-left p-3 rounded-xl border transition-all"
                  style={{
                    borderColor: isActive ? '#3f3f46' : '#18181b',
                    backgroundColor: isActive ? '#18181b' : '#09090b',
                    opacity: isActive ? 1 : 0.5,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        backgroundColor: isActive ? p.color + '20' : '#18181b',
                        border: '1px solid ' + (isActive ? p.color + '40' : '#27272a'),
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: isActive ? p.color : '#52525b' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-white">{p.name}</span>
                        <div
                          className="w-8 h-4 rounded-full relative transition-colors"
                          style={{ backgroundColor: isActive ? YELLOW : '#27272a' }}
                        >
                          <div
                            className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                            style={{ left: isActive ? 16 : 2 }}
                          />
                        </div>
                      </div>
                      <div className="text-zinc-500 uppercase tracking-wide mt-0.5" style={{ fontSize: 10 }}>{p.role}</div>
                      <div className="text-zinc-400 mt-1 leading-snug italic" style={{ fontSize: 11 }}>{p.tagline}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className="mt-8 p-4 rounded-xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(255,204,0,0.1), transparent)',
              borderColor: 'rgba(255,204,0,0.2)',
            }}
          >
            <Sparkles className="w-4 h-4 mb-2" style={{ color: YELLOW }} />
            <div className="text-xs font-semibold text-white mb-1">Today Pulse</div>
            <div className="text-zinc-400 leading-relaxed" style={{ fontSize: 11 }}>
              {buildCount} BUILD signals detected under {preference} strategy.
            </div>
          </div>
        </aside>

        <main className={`${selected ? 'col-span-5 border-r border-zinc-800' : 'col-span-9'} overflow-y-auto transition-all duration-300`}>
          <div
            className="sticky top-0 z-10 px-5 py-4 border-b border-zinc-800"
            style={{ backgroundColor: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(8px)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4" style={{ color: YELLOW }} />
                <h2 className="font-bold text-white">Market Radar</h2>
                <span className="text-xs text-zinc-500">{filteredSignals.length} signals</span>
              </div>
              <button className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filter
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {types.map((t) => {
                const isActive = typeFilter === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className="px-2.5 py-1 rounded-md whitespace-nowrap transition border"
                    style={{
                      fontSize: 11,
                      backgroundColor: isActive ? YELLOW : '#18181b',
                      color: isActive ? '#000' : '#a1a1aa',
                      fontWeight: isActive ? 600 : 400,
                      borderColor: isActive ? YELLOW : '#27272a',
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 space-y-3">
            {filteredSignals.map((s) => (
              <SignalCard
                key={s.id}
                signal={s}
                active={selectedId === s.id}
                preference={preference}
                onClick={() => setSelectedId(s.id)}
              />
            ))}
          </div>
        </main>

        {selected && (
        <aside
          key={'panel-' + selectedId}
          className="col-span-4 overflow-y-auto border-l border-zinc-800"
          style={{ animation: 'panelSlideIn 0.3s ease-out' }}
        >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4" style={{ color: YELLOW }} />
                  <h2 className="font-bold text-white">The Compass</h2>
                </div>
                <div className="flex items-center gap-2">
                  {shifted && (
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded"
                      style={{ fontSize: 10, backgroundColor: 'rgba(255,204,0,0.1)', color: YELLOW }}
                    >
                      <Sparkles className="w-3 h-3" />
                      STRATEGY-ADJUSTED
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
                    title="Close panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                key={preference + '-' + selectedId}
                className="border border-zinc-800 rounded-2xl p-5 mb-4"
                style={{
                  background: 'linear-gradient(135deg, #18181b, #09090b)',
                  animation: 'recommendationPop 0.5s ease-out',
                }}
              >
                <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Recommendation</div>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg mb-4"
                  style={{
                    backgroundColor: rec.bg,
                    color: rec.text,
                    animation: 'glowPulse 2s infinite',
                  }}
                >
                  <RecIcon className="w-5 h-5" />
                  {rec.label}
                </div>

                {shifted && (
                  <div className="text-xs text-zinc-500 mb-3 flex items-center gap-1">
                    <span>Baseline:</span>
                    <span className="font-mono" style={{ color: '#71717a' }}>{signalBaseline(selected)}</span>
                    <span>·</span>
                    <span>Shifted by {preference} strategy</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Signal</div>
                    <div className="text-sm text-white leading-snug">{selected.title}</div>
                  </div>
                  <ConfidenceRing value={adjustedConf} size={100} />
                </div>
              </div>

              <div className="border border-zinc-800 rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(24,24,27,0.5)' }}>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Summary</div>
                <p className="text-sm text-zinc-300 leading-relaxed">{selected.summary}</p>
              </div>

              <div className="border border-zinc-800 rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(24,24,27,0.5)' }}>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Key Reasoning</div>
                <ul className="space-y-2">
                  {selected.reasoning.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-300">
                      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: YELLOW }} />
                      <span className="leading-snug">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setDebateOpen(true)}
                className="w-full p-4 rounded-xl border-2 border-dashed border-zinc-700 transition-all group"
                style={{ backgroundColor: 'rgba(24,24,27,0.3)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = YELLOW;
                  e.currentTarget.style.backgroundColor = 'rgba(255,204,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#3f3f46';
                  e.currentTarget.style.backgroundColor = 'rgba(24,24,27,0.3)';
                }}
              >
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-300">
                  <MessageSquare className="w-4 h-4" />
                  View Persona Debate
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div className="text-zinc-500 mt-1" style={{ fontSize: 11 }}>Watch David, Josef and Steffen discuss this signal</div>
              </button>

              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 font-semibold py-2.5 rounded-lg transition text-sm"
                  style={{ backgroundColor: YELLOW, color: '#000' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = YELLOW_HOVER; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = YELLOW; }}
                >
                  Escalate to PM
                </button>
                <button className="px-3 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {debateOpen && selected && (
        <DebateModal
          signal={selected}
          activePersonas={activePersonas}
          preference={preference}
          onClose={() => setDebateOpen(false)}
        />
      )}
    </div>
  );
}
