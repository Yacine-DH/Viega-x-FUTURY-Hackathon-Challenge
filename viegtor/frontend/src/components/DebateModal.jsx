import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { MessageSquare, X, Users } from 'lucide-react';
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
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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
              <div className="flex-1">
                <Dialog.Title asChild>
                  <h2 className="text-lg font-semibold text-white leading-snug pr-4">
                    {signal.title}
                  </h2>
                </Dialog.Title>
                <div className="flex items-center gap-2 mt-2">
                  <MessageSquare className="w-4 h-4" style={{ color: YELLOW }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: YELLOW }}>
                    Persona Tribunal
                  </span>
                </div>
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

              {status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-500">Convening the tribunal…</p>
                </div>
              )}

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
                  onClick={handleSummon}
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
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="uppercase tracking-wider font-semibold text-zinc-400">Logical Coherence</span>
                      <span className="text-zinc-500">
                        {result.logical_score >= 0.7 ? 'Stored to knowledge base' : 'Below storage threshold'}
                      </span>
                    </div>
                    <ScoreMeter score={result.logical_score} />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-semibold">
                      Synthesized Feedback
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
