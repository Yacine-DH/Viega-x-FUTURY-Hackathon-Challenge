import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, BookOpen } from 'lucide-react';
import { YELLOW } from '../constants/styles';
import { streamRagChat } from '../lib/api';

export default function RagChatbot({ signalId }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || streaming) return;

    setQuestion('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', text: q }, { role: 'assistant', text: '', citedSources: null }]);
    setStreaming(true);

    try {
      for await (const frame of streamRagChat(signalId, q)) {
        if (frame.chunk) {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], text: next[next.length - 1].text + frame.chunk };
            return next;
          });
        }
        if (frame.done) {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], citedSources: frame.cited_sources || [] };
            return next;
          });
        }
      }
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(24,24,27,0.5)' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <MessageSquare className="w-3.5 h-3.5" style={{ color: YELLOW }} />
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Evidence Chatbot</span>
      </div>

      {messages.length > 0 && (
        <div className="px-4 py-3 space-y-4 max-h-64 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div
                    className="max-w-xs px-3 py-2 rounded-xl text-xs text-black font-medium"
                    style={{ backgroundColor: YELLOW }}
                  >
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-300 leading-relaxed">
                  {msg.text || (
                    <span className="flex gap-1 text-zinc-600">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                    </span>
                  )}
                  {msg.citedSources && msg.citedSources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-800">
                      <div className="flex items-center gap-1 text-zinc-500 mb-1" style={{ fontSize: 10 }}>
                        <BookOpen className="w-3 h-3" />
                        Sources
                      </div>
                      <ul className="space-y-0.5">
                        {msg.citedSources.map((src, j) => (
                          <li key={j} className="text-zinc-500 leading-snug" style={{ fontSize: 10 }}>
                            {src}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {error && (
        <div className="px-4 pb-2 text-xs text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-zinc-800">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this signal's evidence..."
          disabled={streaming}
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!question.trim() || streaming}
          className="p-1.5 rounded-lg transition"
          style={{
            backgroundColor: question.trim() && !streaming ? YELLOW : '#27272a',
            color: question.trim() && !streaming ? '#000' : '#52525b',
          }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
