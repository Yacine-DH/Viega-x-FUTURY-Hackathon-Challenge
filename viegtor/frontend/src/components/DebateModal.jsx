import React, { useState } from 'react';
import { MessageSquare, X, Users, AlertTriangle } from 'lucide-react';
import { YELLOW, REC_STYLES } from '../constants/styles';
import { PERSONAS } from '../constants/personas';
import { applyPreference, getConfidenceAdjusted } from '../lib/preference';
import { summonTribunal } from '../lib/api';

// Stagger each persona vote card with CSS animation delay
const STAGGER_MS = 250;

function PersonaVoteCard({ personaId, vote, index }) {
  const persona = PERSONAS[personaId] || {
    name: personaId,
    role: '',
    color: '#71717a',
    icon: Users,
  };
  const Icon = persona.icon;
  const rec = REC_STYLES[vote];

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800"
      style={{
        backgroundColor: '#18181b',
        opacity: 0,
        animation: `debateFade 0.4s ease-out forwards`,
        animationDelay: `${index * STAGGER_MS}ms`,
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: persona.color + '20', border: `1px solid ${persona.color}40` }}
      >
        <Icon className="w-4 h-4" style={{ color: persona.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{persona.name}</div>
        <div className="text-zinc-500 uppercase tracking-wide" style={{ fontSize: 10 }}>{persona.role}</div>
      </div>
      <div
        className="px-2.5 py-1 rounded-lg text-xs font-bold"
        style={{ backgroundColor: rec.bg, color: rec.text }}
      >
        {vote}
      </div>
    </div>
  );
}

export default function DebateModal({ signal, activePersonas, preference, onClose }) {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const adjustedRec = applyPreference(signal, preference);
  const adjustedConf = getConfidenceAdjusted(signal, preference);
  const rec = REC_STYLES[adjustedRec];
  const RecIcon = rec.icon;

  async function handleSummon() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await summonTribunal(signal.id, feedback || 'Please debate this signal.');
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
        <div className="flex items-start justify-between p-6 border-b border-zinc-800">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" style={{ color: YELLOW }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: YELLOW }}>
                Persona Tribunal
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white leading-snug pr-4">{signal.title}</h2>
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
          {/* Idle — feedback input */}
          {status === 'idle' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Five AI personas — David, Josef, Steffen, Volkmar, and Nick — will debate this signal and
                reach a consensus. Add optional context for them below.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional: share your concern or context (e.g. 'Our supply chain can't handle a new SKU before Q4')…"
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

          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-zinc-400">
              <div className="flex gap-2">
                {['david', 'josef', 'steffen', 'volkmar', 'nick'].map((id) => {
                  const p = PERSONAS[id];
                  const Icon = p.icon;
                  return (
                    <div
                      key={id}
                      className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
                      style={{ backgroundColor: p.color + '20', border: `1px solid ${p.color}40` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: p.color }} />
                    </div>
                  );
                })}
              </div>
              <p className="text-sm">Convening tribunal via Gemini Pro…</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-400">{errorMsg}</p>
              <button
                onClick={() => setStatus('idle')}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Done — persona votes + consensus */}
          {status === 'done' && result && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Persona Votes</div>
                <div className="space-y-2">
                  {Object.entries(result.persona_votes).map(([personaId, vote], i) => (
                    <PersonaVoteCard key={personaId} personaId={personaId} vote={vote} index={i} />
                  ))}
                </div>
              </div>

              <div
                className="border border-zinc-800 rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(24,24,27,0.5)',
                  opacity: 0,
                  animation: `debateFade 0.5s ease-out forwards`,
                  animationDelay: `${Object.keys(result.persona_votes).length * STAGGER_MS}ms`,
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Consensus Reasoning
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{result.consensus_reasoning}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer — only when done */}
        {status === 'done' && result && (
          <div className="p-6 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                  Tribunal Consensus
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const cr = REC_STYLES[result.consensus_decision];
                    const CRIcon = cr.icon;
                    return (
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold"
                        style={{ backgroundColor: cr.bg, color: cr.text }}
                      >
                        <CRIcon className="w-4 h-4" />
                        {cr.label}
                      </div>
                    );
                  })()}
                  <span className="text-sm text-zinc-400">{adjustedConf}% confidence</span>
                </div>
              </div>
              <div className="text-xs text-zinc-600 max-w-xs text-right leading-snug">
                Coefficient weights updated in Firestore
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
