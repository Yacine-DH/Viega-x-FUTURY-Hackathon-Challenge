import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { MessageSquare, X } from 'lucide-react';
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
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: YELLOW }}
                  >
                    Persona Debate
                  </span>
                </div>
                <Dialog.Description className="sr-only">
                  Persona debate on {signal.title}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No personas active. Toggle one on from the sidebar to hear the debate.</p>
                </div>
              ) : (
                messages.slice(0, visibleCount).map((msg, idx) => {
                  const p = PERSONAS[msg.persona];
                  const Icon = p.icon;
                  return (
                    <div
                      key={idx}
                      className="flex gap-3"
                      style={{ opacity: 0, animation: 'debateFade 0.4s ease-out forwards' }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{
                          backgroundColor: p.color + '20',
                          border: '1px solid ' + p.color + '40',
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: p.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{p.name}</span>
                          <span className="text-xs text-zinc-500">{p.role}</span>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 leading-relaxed">
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {visibleCount < messages.length && messages.length > 0 && (
                <div className="flex gap-3 items-center text-zinc-500 text-sm pl-12">
                  <div className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {visibleCount >= messages.length && messages.length > 0 && (
              <div className="p-6 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                      Synthesized Recommendation
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold"
                        style={{ backgroundColor: rec.bg, color: rec.text }}
                      >
                        <RecIcon className="w-4 h-4" />
                        {rec.label}
                      </div>
                      <span className="text-sm text-zinc-400">{adjustedConf}% confidence</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {Object.entries(signal.personaVotes)
                      .filter((entry) => activePersonas[entry[0]])
                      .map((entry) => {
                        const pid = entry[0];
                        const vote = entry[1];
                        const p = PERSONAS[pid];
                        const vrec = REC_STYLES[vote];
                        return (
                          <div key={pid} className="text-center">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                              style={{
                                backgroundColor: vrec.bg,
                                color: vrec.text,
                                fontSize: 10,
                              }}
                            >
                              {p.name[0]}
                            </div>
                            <div
                              className="text-zinc-500 mt-1"
                              style={{ fontSize: 9 }}
                            >
                              {vote}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
