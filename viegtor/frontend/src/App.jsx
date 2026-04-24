import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [view, setView] = useState('home');

  const enter = () => setView('app');
  const signOut = () => setView('home');

  const keyframes =
    '@keyframes debateFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }' +
    '@keyframes glowPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(255, 204, 0, 0); } }' +
    '@keyframes recommendationPop { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }' +
    '@keyframes panelSlideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }' +
    '@keyframes hintPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      {view === 'home' && (
        <HomePage onEnterCO={enter} onEnterExpert={enter} />
      )}
      {view === 'app' && <Dashboard onSignOut={signOut} />}
    </>
  );
}
