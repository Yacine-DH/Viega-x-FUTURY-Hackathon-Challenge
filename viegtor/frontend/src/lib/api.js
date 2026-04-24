const BASE = '/api';

async function fetchJSON(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export function getSignals(decision = null, limit = 50) {
  const params = new URLSearchParams({ limit });
  if (decision) params.set('decision', decision);
  return fetchJSON(`/signals?${params}`);
}

export function getSignal(signalId) {
  return fetchJSON(`/signals/${signalId}`);
}

export function getSignalStats() {
  return fetchJSON('/signals/stats');
}

export function summonTribunal(signalId, userFeedback) {
  return fetchJSON('/tribunal/summon', {
    method: 'POST',
    body: JSON.stringify({ signal_id: signalId, user_feedback: userFeedback }),
  });
}

export function getTribunalSession(signalId) {
  return fetchJSON(`/tribunal/${signalId}`);
}

export function getCurrentWeights() {
  return fetchJSON('/tribunal/weights/current');
}

export async function* streamRagChat(signalId, userQuestion) {
  const res = await fetch(`${BASE}/chat/rag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signal_id: signalId, user_question: userQuestion }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6));
      }
    }
  }
}
