import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Radar, TrendingUp, Activity, Sparkles,
  Bell, Search, Settings, LogOut, Filter, MapPin,
  ZoomIn, ZoomOut, RotateCcw,
} from 'lucide-react';
import { YELLOW } from '../constants/styles';
import { SIGNALS } from '../constants/signals';
import { computeTier } from '../lib/tier';
import NavItem from '../components/NavItem';
import TierSection from '../components/TierSection';
import FiledSection from '../components/FiledSection';
import FeedbackChatBar from '../components/FeedbackChatBar';
import Logo from '../components/Logo';

export default function Dashboard({ onSignOut, onOpenTrend, onHome }) {
  const [typeFilter, setTypeFilter] = useState('All');
  const [zoom, setZoom] = useState(1);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [dragging, setDragging] = useState(false);

  const onDrag = useCallback((e) => {
    setSidebarWidth((w) => Math.min(520, Math.max(200, e.clientX)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, onDrag]);

  const zoomIn = () => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)));
  const zoomReset = () => setZoom(1);

  const types = ['All'].concat(Array.from(new Set(SIGNALS.map((s) => s.type))));
  const filteredSignals = typeFilter === 'All' ? SIGNALS : SIGNALS.filter((s) => s.type === typeFilter);

  const tiered = useMemo(() => {
    const groups = { ACT: [], TRACK: [], FIELD: [] };
    filteredSignals.forEach((s) => {
      groups[computeTier(s.recommendation, s.confidence)].push(s);
    });
    return groups;
  }, [filteredSignals]);

  const buildCount = SIGNALS.filter((s) => s.recommendation === 'BUILD').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white" style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
      <header className="sticky top-0 z-30" style={{ backgroundColor: 'transparent' }}>
        <div className="flex items-center justify-between px-6 py-3">
          <button
            onClick={onHome}
            className="flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-zinc-900 transition"
            title="Back to home"
          >
            <Logo size={24} />
          </button>

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
            <div className="flex items-center gap-1 mx-1 px-1 py-0.5 rounded-lg border border-zinc-800" style={{ backgroundColor: '#0f0f12' }}>
              <button onClick={zoomOut} className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800" title="Zoom out"><ZoomOut className="w-3.5 h-3.5" /></button>
              <button onClick={zoomReset} className="px-1.5 text-[11px] font-mono text-zinc-400 hover:text-white" title="Reset zoom">{Math.round(zoom * 100)}%</button>
              <button onClick={zoomIn} className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800" title="Zoom in"><ZoomIn className="w-3.5 h-3.5" /></button>
            </div>
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

      <div className="flex relative" style={{ height: 'calc(100vh - 57px)', zoom }}>
        <aside className="border-r border-zinc-800 overflow-y-auto p-5 flex-shrink-0" style={{ width: sidebarWidth }}>
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Navigation</div>
          <nav className="space-y-1 mb-8">
            <NavItem icon={Radar} label="Radar" active count={signals.length} />
            <NavItem icon={Activity} label="Decisions" count={3} />
            <NavItem icon={TrendingUp} label="Trends" />
            <NavItem icon={Sparkles} label="AI Insights" />
          </nav>

          <div
            className="mt-4 p-4 rounded-xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(255,204,0,0.1), transparent)',
              borderColor: 'rgba(255,204,0,0.2)',
            }}
          >
            <Sparkles className="w-4 h-4 mb-2" style={{ color: YELLOW }} />
            <div className="text-xs font-semibold text-white mb-1">Today Pulse</div>
            <div className="text-zinc-400 leading-relaxed" style={{ fontSize: 11 }}>
              {buildCount} BUILD signals detected across monitored markets.
            </div>
          </div>
        </aside>

        <div
          onMouseDown={() => setDragging(true)}
          className="w-1 cursor-col-resize flex-shrink-0 hover:bg-yellow-400/40 transition"
          style={{ backgroundColor: dragging ? 'rgba(255,204,0,0.5)' : 'transparent' }}
          title="Drag to resize"
        />

        <main className="flex-1 overflow-y-auto relative min-w-0">
          <div
            className="sticky top-0 z-10 px-5 py-4 border-b border-zinc-800"
            style={{ backgroundColor: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(8px)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4" style={{ color: YELLOW }} />
                <h2 className="font-bold text-white">Market Radar</h2>
                <span className="text-xs text-zinc-500">{filteredSignals.length} signals</span>
                <button
                  className="ml-2 flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                  title="Radar location (configure)"
                >
                  <MapPin className="w-3.5 h-3.5" style={{ color: YELLOW }} />
                  <span>EU-27 · DACH</span>
                </button>
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

          <div className="p-5 pb-8">
            <TierSection tier="ACT" signals={tiered.ACT} onCardClick={onOpenTrend} />
            <TierSection tier="TRACK" signals={tiered.TRACK} onCardClick={onOpenTrend} />
            <FiledSection signals={tiered.FIELD} />
          </div>
        </main>
      </div>

      <div className="fixed bottom-4 z-40" style={{ left: 16, width: Math.max(260, sidebarWidth - 32) }}>
        <FeedbackChatBar signals={SIGNALS} />
      </div>
    </div>
  );
}
