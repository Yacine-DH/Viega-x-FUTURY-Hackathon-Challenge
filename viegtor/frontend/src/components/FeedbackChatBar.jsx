import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { YELLOW } from '../constants/styles';

const BASE = '/api';

async function fetchRagAnswer(signalId, question) {
  const res = await fetch(`${BASE}/chat/rag/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signal_id: signalId, user_question: question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.answer;
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'rgba(255,204,0,0.12)', border: '1px solid rgba(255,204,0,0.3)' }}
      >
        <MessageSquare className="w-3.5 h-3.5" style={{ color: YELLOW }} />
      </div>
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-tl-sm" style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}>
        <span className="text-xs text-zinc-400 mr-1">Viegtor is thinking</span>
        {[0, 160, 320].map((d) => (
          <span
            key={d}
            className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block"
            style={{
              animation: 'bounce 1.2s infinite',
              animationDelay: `${d}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Lightweight markdown renderer: handles **bold** and paragraph breaks
function renderMarkdown(text) {
  return text.split('\n\n').map((para, pIdx) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  });
}

function ChatBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
          style={{ backgroundColor: 'rgba(255,204,0,0.12)', border: '1px solid rgba(255,204,0,0.3)' }}
        >
          <MessageSquare className="w-3.5 h-3.5" style={{ color: YELLOW }} />
        </div>
      )}
      <div
        className="max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed"
        style={{
          backgroundColor: isUser ? YELLOW : '#18181b',
          color: isUser ? '#000' : '#d4d4d8',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          border: isUser ? 'none' : '1px solid #27272a',
          fontWeight: isUser ? 500 : 400,
          wordBreak: 'break-word',
        }}
      >
        {isUser ? text : renderMarkdown(text)}
      </div>
    </div>
  );
}

export default function FeedbackChatBar({ signals = [], initialAttachedId = null, lockAttachment = false }) {
  const attachedId = initialAttachedId != null ? String(initialAttachedId) : null;
  const attached = signals.find((s) => String(s.id) === attachedId) || null;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (expanded) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thinking, expanded]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || !attached || thinking) return;

    const userMsg = { role: 'user', text: msg };
    setMessages((prev) => [...prev, userMsg]);
    setText('');
    setThinking(true);
    setExpanded(true);

    const start = Date.now();
    try {
      const answer = await fetchRagAnswer(attached.id, msg);
      const elapsed = Date.now() - start;
      const minWait = 2000;
      if (elapsed < minWait) {
        await new Promise((r) => setTimeout(r, minWait - elapsed));
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      const elapsed = Date.now() - start;
      if (elapsed < 2000) await new Promise((r) => setTimeout(r, 2000 - elapsed));
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Sorry, I couldn't retrieve an answer: ${err.message}` },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const hasChat = messages.length > 0 || thinking;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#0f0f12',
        border: '1px solid #27272a',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Chat history — shown only when expanded and has messages */}
      {expanded && hasChat && (
        <div
          className="flex flex-col gap-3 px-3 pt-3 overflow-y-auto"
          style={{ maxHeight: 320 }}
        >
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} />
          ))}
          {thinking && <ThinkingDots />}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Collapse / expand toggle when there are messages */}
      {hasChat && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1 py-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition"
          style={{ borderBottom: '1px solid #1f1f23' }}
        >
          {expanded ? (
            <><ChevronDown className="w-3 h-3" /> Hide chat</>
          ) : (
            <><ChevronUp className="w-3 h-3" /> {messages.length} message{messages.length !== 1 ? 's' : ''}</>
          )}
        </button>
      )}

      {/* Attached signal badge */}
      {attached && (
        <div
          className="flex items-center gap-2 px-3 pt-2.5 pb-1"
          style={{ borderTop: hasChat ? '1px solid #1f1f23' : 'none' }}
        >
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0"
            style={{
              backgroundColor: attached.recommendation === 'BUILD' ? 'rgba(255,204,0,0.15)' : attached.recommendation === 'INVEST' ? 'rgba(59,130,246,0.15)' : 'rgba(113,113,122,0.15)',
              color: attached.recommendation === 'BUILD' ? YELLOW : attached.recommendation === 'INVEST' ? '#60a5fa' : '#71717a',
            }}
          >
            {attached.recommendation}
          </span>
          <span className="text-[11px] text-zinc-400 truncate">{attached.title}</span>
          {lockAttachment && (
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider ml-auto flex-shrink-0">context</span>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={
            !attached
              ? 'No signal attached…'
              : thinking
              ? 'Viegtor is thinking…'
              : 'Ask anything about this signal…'
          }
          disabled={!attached || thinking}
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          style={{ minWidth: 0 }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || !attached || thinking}
          className="p-2 rounded-xl transition-all disabled:opacity-40"
          style={{ backgroundColor: YELLOW, color: '#000' }}
          title={attached ? 'Ask Viegtor' : 'Attach a signal first'}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
