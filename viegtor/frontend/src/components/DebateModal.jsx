import React, { useState } from 'react';
import { MessageSquare, X, Users, AlertTriangle, Database, CheckCircle } from 'lucide-react';
import { YELLOW } from '../constants/styles';
import { PERSONAS } from '../constants/personas';
import { summonTribunal } from '../lib/api';

const STAGGER_MS = 300;

function ScoreMeter({ score }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? '#34D399' : score >= 0.45 ? YELLOW : '#F87171';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-9 text-right" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function ArgumentBubble({ personaId, argument, index }) {
  const persona = PERSONAS[personaId.toLowerCase()] || {
    name: personaId,
    role: '',
    color: '#71717a',
    icon: Users,
  };
  const Icon = persona.icon;

  return (
    <div
      className="flex gap-3"
      style={{
        opacity: 0,
        animation: 'debateFade 0.4s ease-out forwards',
        animationDelay: `${index * STAGGER_MS}ms`,
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
        style={{ backgroundColor: persona.color + '20', border: `1px solid ${persona.color}40` }}
      >
        <Icon className="w-4 h-4" style={{ color: persona.color }} />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{persona.name}</span>
          <span className="text-zinc-500 uppercase tracking-wide" style={{ fontSize: 9 }}>
            {persona.role}
          </span>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl rounded-tl-sm p-3 text-sm text-zinc-300 leading-relaxed">
          {argument}
        </div>
      </div>
    </div>
  );
}

export default function DebateModal({ signal, onClose }) {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const personaCount = result ? Object.keys(result.persona_arguments).length : 0;

  async function handleSummon() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await summonTribunal(signal.id, feedback || 'Please analyze this signal.');
      setResult(data);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="max-w-3xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-800 flex-shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" style={{ color: YELLOW }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: YELLOW }}>
                Persona Tribunal
              </span>
            </div>
            <h2 className="text-base font-semibold text-white leading-snug pr-4">{signal.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Idle: context input ── */}
          {status === 'idle' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Five AI personas will read this signal's evidence trail and debate what it means
                for Viega from their unique perspectives. The tribunal then synthesises a
                middle-ground constructive feedback for you.
              </p>
              <p className="text-xs text-zinc-600">
                Feedback scoring ≥ 70% logical coherence is automatically stored in the database.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional: share your concern or context — e.g. 'Our supply chain cannot absorb a new SKU before Q4. Is this urgent enough to act now anyway?'"
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 resize-none"
              />
              <button
                onClick={handleSummon}
                className="w-full py-3 rounded-xl font-semibold text-sm transition"
                style={{ backgroundColor: YELLOW, color: '#000' }}
              >
                Summon Tribunal
              </button>
            </div>
          )}

          {/* ── Loading ── */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-zinc-400">
              <div className="flex gap-2">
                {['david', 'josef', 'steffen', 'volkmar', 'nick'].map((id, i) => {
                  const p = PERSONAS[id];
                  const Icon = p.icon;
                  return (
                    <div
                      key={id}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: p.color + '20',
                        border: `1px solid ${p.color}40`,
                        animation: 'glowPulse 2s infinite',
                        animationDelay: `${i * 200}ms`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: p.color }} />
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-300">Convening tribunal…</p>
                <p className="text-xs text-zinc-600 mt-1">Gemini Pro is running the 5-persona debate</p>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-400 max-w-sm">{errorMsg}</p>
              <button
                onClick={() => setStatus('idle')}
                className="text-xs text-zinc-400 hover:text-white underline mt-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── Done: persona arguments + consensus ── */}
          {status === 'done' && result && (
            <div className="space-y-6">

              {/* Persona arguments */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
                  Persona Perspectives
                </div>
                <div className="space-y-4">
                  {Object.entries(result.persona_arguments).map(([personaId, argument], i) => (
                    <ArgumentBubble
                      key={personaId}
                      personaId={personaId}
                      argument={argument}
                      index={i}
                    />
                  ))}
                </div>
              </div>

              {/* Consensus feedback */}
              <div
                className="border rounded-xl p-4"
                style={{
                  borderColor: 'rgba(255,204,0,0.25)',
                  backgroundColor: 'rgba(255,204,0,0.04)',
                  opacity: 0,
                  animation: 'debateFade 0.5s ease-out forwards',
                  animationDelay: `${personaCount * STAGGER_MS + 200}ms`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: YELLOW }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: YELLOW }}>
                    Tribunal Consensus
                  </span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed">{result.consensus_feedback}</p>
              </div>

            </div>
          )}
        </div>

        {/* Footer — score + stored indicator, only when done */}
        {status === 'done' && result && (
          <div
            className="flex-shrink-0 border-t border-zinc-800 px-6 py-4"
            style={{
              opacity: 0,
              animation: 'debateFade 0.4s ease-out forwards',
              animationDelay: `${personaCount * STAGGER_MS + 500}ms`,
            }}
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">
                  Logical Coherence Score
                </div>
                <ScoreMeter score={result.logical_score} />
              </div>

              <div className="flex-shrink-0">
                {result.stored ? (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
                    style={{ borderColor: 'rgba(52,211,153,0.3)', color: '#34D399', backgroundColor: 'rgba(52,211,153,0.08)' }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Stored in DB
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
                    style={{ borderColor: '#27272a', color: '#71717a', backgroundColor: 'rgba(39,39,42,0.4)' }}
                  >
                    <Database className="w-3.5 h-3.5" />
                    Below threshold
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
