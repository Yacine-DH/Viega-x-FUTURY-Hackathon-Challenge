import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { MessageSquare, X, Users, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { YELLOW } from '../constants/styles';
import { PERSONAS } from '../constants/personas';
import { summonTribunal } from '../lib/api';

const STAGGER_MS = 300;
const PERSONA_ORDER = ['david', 'josef', 'steffen', 'volkmar', 'nick'];

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

function PersonaAvatar({ persona, active, size = 14 }) {
  const Icon = persona.icon;
  return (
    <div
      className="rounded-full flex items-center justify-center transition-all"
      style={{
        width: size * 4,
        height: size * 4,
        backgroundColor: persona.color + (active ? '30' : '15'),
        border: `1px solid ${persona.color}${active ? '80' : '30'}`,
        boxShadow: active ? `0 0 24px ${persona.color}60` : 'none',
        transform: active ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      <Icon className="w-4 h-4" style={{ color: persona.color }} />
    </div>
  );
}

function LoadingStage() {
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % PERSONA_ORDER.length);
    }, 520);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6">
      <div className="flex items-center gap-4">
        {PERSONA_ORDER.map((id, i) => (
          <PersonaAvatar key={id} persona={PERSONAS[id]} active={i === activeIdx} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
        <p className="text-sm text-zinc-400">Convening the tribunal…</p>
      </div>
      <p className="text-[11px] text-zinc-600 uppercase tracking-[0.25em]">
        5 personas · analyzing your feedback
      </p>
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

export default function DebateModal({ signal, onClose, initialFeedback = '', autoStart = false }) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [status, setStatus] = useState(autoStart ? 'loading' : 'idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const startedRef = useRef(false);

  async function handleSummon(fb) {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await summonTribunal(signal.id, fb || feedback || 'Please analyze this signal.');
      setResult(data);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  useEffect(() => {
    if (autoStart && !startedRef.current) {
      startedRef.current = true;
      handleSummon(initialFeedback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRelevant = result && result.logical_score >= 0.7;

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 data-[state=open]:animate-[debateFade_0.2s_ease-out]"
          style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 p-4 focus:outline-none data-[state=open]:animate-[debateFade_0.3s_ease-out]"
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl"
            style={{ maxHeight: '90vh' }}
          >
            <div className="flex items-start justify-between p-6 border-b border-zinc-800">
              <div className="flex-1 min-w-0">
                <Dialog.Title asChild>
                  <h2 className="text-lg font-semibold text-white leading-snug pr-4 truncate">
                    {signal.title}
                  </h2>
                </Dialog.Title>
                <div className="flex items-center gap-2 mt-2">
                  <MessageSquare className="w-4 h-4" style={{ color: YELLOW }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: YELLOW }}>
                    Persona Tribunal
                  </span>
                </div>
                {initialFeedback && (
                  <p className="text-xs text-zinc-500 mt-2 italic line-clamp-2">“{initialFeedback}”</p>
                )}
                <Dialog.Description className="sr-only">
                  5-persona expert debate on {signal.title}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {status === 'idle' && (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Five expert personas will analyze the evidence behind this signal from their unique perspectives and synthesize actionable feedback for your team.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Your concern or context (optional)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g. I'm concerned about R&D cost vs. timeline..."
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 resize-none"
                    />
                  </div>
                </div>
              )}

              {status === 'loading' && <LoadingStage />}

              {status === 'error' && (
                <div className="rounded-xl border border-red-900/50 p-4 text-sm text-red-400" style={{ backgroundColor: 'rgba(127,29,29,0.15)' }}>
                  {errorMsg || 'An unexpected error occurred. Please try again.'}
                </div>
              )}

              {status === 'done' && result && (
                <div className="space-y-4">
                  {Object.entries(result.persona_arguments).map(([personaId, argument], idx) => (
                    <ArgumentBubble
                      key={personaId}
                      personaId={personaId}
                      argument={argument}
                      index={idx}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800">
              {status === 'idle' && (
                <button
                  onClick={() => handleSummon()}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition"
                  style={{ backgroundColor: YELLOW, color: '#000' }}
                >
                  Summon Tribunal
                </button>
              )}

              {status === 'error' && (
                <button
                  onClick={() => setStatus('idle')}
                  className="w-full py-2.5 rounded-xl font-bold text-sm border border-zinc-700 text-zinc-300 hover:text-white transition"
                >
                  Try Again
                </button>
              )}

              {status === 'done' && result && (
                <div className="space-y-3">
                  <div
                    className="rounded-xl border p-3 flex items-start gap-3"
                    style={{
                      borderColor: isRelevant ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)',
                      backgroundColor: isRelevant ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                    }}
                  >
                    {isRelevant ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#34D399' }} />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#F87171' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-bold uppercase tracking-wider mb-0.5"
                        style={{ color: isRelevant ? '#34D399' : '#F87171' }}
                      >
                        {isRelevant ? 'Relevant · Saved to memory' : 'Not relevant · Discarded'}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {isRelevant
                          ? 'Feedback stored in knowledge base; coefficients updated.'
                          : 'Logical coherence below threshold — will not influence future decisions.'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="uppercase tracking-wider font-semibold text-zinc-400">Logical Coherence</span>
                      <span className="text-zinc-500">threshold 70%</span>
                    </div>
                    <ScoreMeter score={result.logical_score} />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3 h-3" style={{ color: YELLOW }} />
                      <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                        Consensus
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      {result.consensus_feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
