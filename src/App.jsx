import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import SignupPage from './pages/SignupPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'signup', 'dashboard'
  const [selectedRole, setSelectedRole] = useState(null);

  const keyframes =
    '@keyframes debateFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }' +
    '@keyframes glowPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(255, 204, 0, 0); } }' +
    '@keyframes recommendationPop { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      {currentPage === 'home' && (
        <HomePage
          onSignIn={(role) => { setSelectedRole(role); setCurrentPage('dashboard'); }}
          onSignUp={() => setCurrentPage('signup')}
        />
      )}
      {currentPage === 'signup' && (
        <SignupPage onSignup={(user) => { setSelectedRole(user.role); setCurrentPage('dashboard'); }} />
      )}
      {currentPage === 'dashboard' && (
        <Dashboard role={selectedRole} onSignOut={() => { setSelectedRole(null); setCurrentPage('home'); }} />
      )}
    </>
  );
}
