import React, { useState } from 'react';
import { Compass, X, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { YELLOW } from '../constants/styles';

export default function LoginModal({ onSuccess, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (username === 'test' && password === 'test') {
        setLoading(false);
        onSuccess();
      } else {
        setLoading(false);
        setError('Invalid credentials. Hint: try test / test');
      }
    }, 500);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: YELLOW }}>
            <Compass className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Welcome back</h2>
            <p className="text-xs text-zinc-500">Sign in to access your Compass</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Username</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 text-zinc-500" style={{ transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="test"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 text-zinc-500" style={{ transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="test"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg border text-sm"
              style={{ borderColor: 'rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.05)', color: '#fca5a5' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition"
            style={{
              backgroundColor: loading ? '#3f3f46' : YELLOW,
              color: loading ? '#a1a1aa' : '#000',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : (<>Sign In <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </div>

        <div
          className="mt-4 p-3 rounded-lg border text-center"
          style={{ borderColor: 'rgba(255,204,0,0.2)', backgroundColor: 'rgba(255,204,0,0.05)' }}
        >
          <div className="text-zinc-500 mb-1" style={{ fontSize: 11 }}>Demo credentials</div>
          <div className="text-sm font-mono" style={{ color: YELLOW }}>test / test</div>
        </div>
      </div>
    </div>
  );
}
