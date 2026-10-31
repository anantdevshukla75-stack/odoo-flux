import React, { useState } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { CreditCard, Layers, Zap, CheckCircle2, UserCheck } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setView('landing');
  };

  if (view === 'login') {
    return <Login onSwitchToRegister={() => setView('register')} onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === 'register') {
    return <Register onSwitchToLogin={() => setView('login')} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('landing')}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Brightloop SMS</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-500/20 font-semibold flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5" /> {user.email} ({user.role})
              </span>
            ) : (
              <>
                <button
                  onClick={() => setView('login')}
                  className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setView('register')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Subscription Management System
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
          Recurring billing, invoice automation, and multi-tier subscription engine for Brightloop Software.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl">
            <CreditCard className="h-8 w-8 text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Automated Billing</h3>
            <p className="text-slate-400 text-sm">Recurring payment triggers and invoice sync.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl">
            <Layers className="h-8 w-8 text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Tier & Variant Control</h3>
            <p className="text-slate-400 text-sm">Odoo brand variants and flexible billing intervals.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl">
            <CheckCircle2 className="h-8 w-8 text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Role Access Portal</h3>
            <p className="text-slate-400 text-sm">Tailored views for Admins, Staff, and Customers.</p>
          </div>
        </div>
      </main>
    </div>
  );
}