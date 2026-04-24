import { useState } from 'react';
import { ChevronRight, Compass } from 'lucide-react';

export default function SignupPage({ onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null); // 'co' or 'expert'
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select CO or Expert mode');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    // Demo signup - just store role and pretend account created
    if (onSignup) {
      onSignup({ email, role: selectedRole });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6" style={{ color: '#FFCC00' }} />
          <span className="text-white font-bold tracking-wide">viega</span>
          <span className="text-zinc-500 text-sm ml-1">INTELLIGENT COMPASS</span>
        </div>
        <a href="/" className="text-zinc-400 hover:text-white transition text-sm">
          ← Back to home
        </a>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-zinc-400">Choose your role to begin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm text-zinc-400 mb-1">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-zinc-400 mb-1">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                placeholder="••••••"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-zinc-400 mb-1">CONFIRM PASSWORD</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                placeholder="••••••"
                required
              />
            </div>

            {/* Role selection boxes - side by side */}
            <div>
              <label className="block text-sm text-zinc-400 mb-3">SELECT YOUR MODE</label>
              <div className="flex gap-4">
                {/* CO Box */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('co')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    selectedRole === 'co'
                      ? 'border-yellow-500 bg-zinc-800'
                      : 'border-zinc-700 bg-zinc-900 opacity-60 hover:opacity-100'
                  }`}
                  style={selectedRole === 'co' ? { boxShadow: '0 0 15px rgba(255,204,0,0.2)' } : {}}
                >
                  <div className="text-left">
                    <div className="text-white font-bold text-lg">CO MODE</div>
                    <div className="text-zinc-400 text-sm mt-1">Executive Overview</div>
                    <div className="text-zinc-500 text-xs mt-2">Fast. Focused. Clear.</div>
                  </div>
                </button>

                {/* Expert Box */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('expert')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    selectedRole === 'expert'
                      ? 'border-yellow-500 bg-zinc-800'
                      : 'border-zinc-700 bg-zinc-900 opacity-60 hover:opacity-100'
                  }`}
                  style={selectedRole === 'expert' ? { boxShadow: '0 0 15px rgba(255,204,0,0.2)' } : {}}
                >
                  <div className="text-left">
                    <div className="text-white font-bold text-lg">EXPERT MODE</div>
                    <div className="text-zinc-400 text-sm mt-1">Deep Dive Analysis</div>
                    <div className="text-zinc-500 text-xs mt-2">Comprehensive. In-depth. Debates.</div>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: '#FFCC00', color: '#09090b' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFD633'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFCC00'}
            >
              Create account <ChevronRight className="w-4 h-4" />
            </button>

            <p className="text-center text-zinc-500 text-xs mt-4">
              Demo: any email works — this is a prototype
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
