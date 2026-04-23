import React from 'react';
import { Compass, Radar, MessageSquare, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { YELLOW, YELLOW_HOVER } from '../constants/styles';
import FeatureCard from '../components/FeatureCard';
import StatCard from '../components/StatCard';

export default function HomePage({ onLaunch, onSignIn }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-y-auto" style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: YELLOW }}>
            <Compass className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="font-bold">Viega Intelligent Compass</div>
            <div className="text-zinc-500 uppercase tracking-wider" style={{ fontSize: 10 }}>Futury x Viega 2026</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition">Product</button>
          <button className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition">Personas</button>
          <button className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition">Method</button>
          <button className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition">About</button>
          <button
            onClick={onSignIn}
            className="ml-2 flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition"
            style={{ backgroundColor: YELLOW, color: '#000' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = YELLOW_HOVER; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = YELLOW; }}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 pt-20 pb-24 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8"
          style={{ borderColor: 'rgba(255,204,0,0.3)', backgroundColor: 'rgba(255,204,0,0.05)' }}
        >
          <Sparkles className="w-3 h-3" style={{ color: YELLOW }} />
          <span className="text-xs font-semibold" style={{ color: YELLOW }}>AI-powered decision engine</span>
        </div>

        <h1 className="text-6xl font-bold mb-6 leading-tight">
          Navigate the ocean
          <br />
          <span style={{ color: YELLOW }}>of market noise.</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Turn scattered patents, competitor moves and regulations into clear, actionable strategy. Build, Invest, or Ignore — decided for you.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onLaunch}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition"
            style={{ backgroundColor: YELLOW, color: '#000' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = YELLOW_HOVER; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = YELLOW; }}
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="px-6 py-3 rounded-xl font-semibold text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white transition">
            Watch Demo
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={Radar}
            title="Market Radar"
            description="Aggregates patents, competitor news, regulations and market trends into a unified signal feed."
          />
          <FeatureCard
            icon={MessageSquare}
            title="AI Personas"
            description="David, Josef and Steffen debate every signal from their strategic lens before a verdict is issued."
          />
          <FeatureCard
            icon={Compass}
            title="Strategic Compass"
            description="Every signal resolves to one of three paths: Build a product, Invest in tech, or Ignore the hype."
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard value="6" label="Live signals" />
          <StatCard value="3" label="AI personas" />
          <StatCard value="3" label="Strategic modes" />
          <StatCard value="87%" label="Avg. confidence" />
        </div>
      </div>

      <footer className="border-t border-zinc-900 mt-12 py-6 text-center text-xs text-zinc-600">
        Viega Intelligent Compass · Prototype for Futury x Viega Hackathon 2026
      </footer>
    </div>
  );
}
