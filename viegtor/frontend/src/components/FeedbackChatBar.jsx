import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Paperclip, Mic, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import { YELLOW, REC_STYLES } from '../constants/styles';
import DebateModal from './DebateModal';

export default function FeedbackChatBar({ signals = [], initialAttachedId = null, lockAttachment = false }) {
  const [text, setText] = useState('');
  const [attachedId, setAttachedId] = useState(
    initialAttachedId != null ? String(initialAttachedId) : null
  );
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tribunal, setTribunal] = useState(null); // { signal, feedback }
  const popRef = useRef(null);

  const sorted = useMemo(
    () => [...signals].sort((a, b) => b.impact - a.impact),
    [signals]
  );
  const visible = showMore ? sorted : sorted.slice(0, 4);
  const attached = signals.find((s) => String(s.id) === attachedId);

  useEffect(() => {
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const active = hovered || focused;
  const glow = active
    ? `-18px 0 32px -8px rgba(255,204,0,0.35), 18px 0 32px -8px rgba(255,255,255,0.25), 0 0 0 1px rgba(255,204,0,0.25)`
    : `0 0 0 1px #27272a`;

  const send = () => {
    const msg = text.trim();
    if (!msg || !attached) return;
    setTribunal({ signal: attached, feedback: msg });
    setText('');
    if (!lockAttachment) setAttachedId(null);
  };

  return (
    <>
      <div className="relative">
        {attached && (
          <div className="absolute -top-9 left-4 flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs text-zinc-300"
            style={{ borderColor: lockAttachment ? 'rgba(255,204,0,0.4)' : '#3f3f46', backgroundColor: lockAttachment ? 'rgba(255,204,0,0.08)' : '#18181b' }}
          >
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ backgroundColor: REC_STYLES[attached.recommendation].bg, color: REC_STYLES[attached.recommendation].text }}
            >
              {attached.recommendation}
            </span>
            <span className="max-w-[260px] truncate">{attached.title}</span>
            {lockAttachment ? (
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">context</span>
            ) : (
              <button onClick={() => setAttachedId(null)} className="text-zinc-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="rounded-2xl transition-all duration-300"
          style={{
            backgroundColor: '#0f0f12',
            boxShadow: glow,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="relative" ref={popRef}>
              <button
                onClick={() => !lockAttachment && setOpen((o) => !o)}
                disabled={lockAttachment}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                title={lockAttachment ? 'Trend attached as context' : 'Attach a trend'}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {open && !lockAttachment && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-[380px] rounded-xl border border-zinc-800 shadow-2xl z-40"
                  style={{ backgroundColor: '#0f0f12' }}
                >
                  <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Attach a trend</span>
                    <span className="text-xs text-zinc-500">{sorted.length} available</span>
                  </div>
                  <ul className="max-h-[320px] overflow-y-auto p-2 space-y-1">
                    {visible.map((s) => {
                      const rec = REC_STYLES[s.recommendation];
                      const isSel = attachedId === s.id;
                      return (
                        <li key={s.id}>
                          <button
                            onClick={() => {
                              setAttachedId(isSel ? null : String(s.id));
                              setOpen(false);
                            }}
                            className="w-full text-left p-2.5 rounded-lg border hover:bg-zinc-900 transition"
                            style={{
                              borderColor: isSel ? YELLOW : '#27272a',
                              backgroundColor: isSel ? 'rgba(255,204,0,0.05)' : 'transparent',
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0"
                                style={{ backgroundColor: rec.bg, color: rec.text }}
                              >
                                {s.recommendation}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white leading-snug line-clamp-2">{s.title}</div>
                                <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                                  <span>{s.type}</span>
                                  <span>·</span>
                                  <span>Impact {s.impact}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {sorted.length > 4 && (
                    <button
                      onClick={() => setShowMore((v) => !v)}
                      className="w-full px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-1"
                    >
                      {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showMore ? 'Show less' : `Show ${sorted.length - 4} more`}
                    </button>
                  )}
                </div>
              )}
            </div>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder={attached ? 'Share your opinion on this trend…' : 'Attach a trend first to share feedback…'}
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none px-1"
            />

            <button
              onClick={() => {}}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Voice input (coming soon)"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              onClick={send}
              disabled={!text.trim() || !attached}
              className="p-2 rounded-lg transition disabled:opacity-40"
              style={{ backgroundColor: YELLOW, color: '#000' }}
              title={attached ? 'Summon tribunal with your feedback' : 'Attach a trend first'}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {tribunal && (
        <DebateModal
          signal={tribunal.signal}
          initialFeedback={tribunal.feedback}
          autoStart
          onClose={() => setTribunal(null)}
        />
      )}
    </>
  );
}
