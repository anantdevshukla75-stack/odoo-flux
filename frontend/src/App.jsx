import React, { useState } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Sidebar from './components/Navigation/Sidebar';
import TopHeader from './components/Navigation/TopHeader';
import { CreditCard, Layers, Zap, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing', 'login', 'register', 'app'
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState('admin'); // 'admin', 'staff', 'customer'
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveRole(userData.role || 'admin');
    setView('app');
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
  };

  if (view === 'login') {
    return <Login onSwitchToRegister={() => setView('register')} onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === 'register') {
    return <Register onSwitchToLogin={() => setView('login')} />;
  }

  // Application Dashboard Portal Layout
  if (view === 'app') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
        <Sidebar
          activeRole={activeRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          <TopHeader
            user={user}
            activeRole={activeRole}
            onRoleSwitch={(role) => {
              setActiveRole(role);
              setActiveTab(role === 'customer' ? 'my_subscriptions' : 'dashboard');
            }}
          />

          <main className="p-8 flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-5">
                <div>
                  <h1 className="text-2xl font-bold text-white capitalize">{activeTab.replace('_', ' ')}</h1>
                  <p className="text-slate-400 text-xs mt-1">
                    Managing Brightloop Software as <span className="text-indigo-400 font-semibold uppercase">{activeRole}</span>
                  </p>
                </div>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-semibold">
                  Sub-2s Target Active
                </span>
              </div>

              {/* Placeholder Workspace Area */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <p className="text-slate-400 text-sm">
                  Active module view for <strong className="text-white">{activeTab}</strong>. Next step: Product & Subscription State Machine views.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Public Landing Page View
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

        <div className="grid md:grid-cols-3 gap-6 text-left mb-12">
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

        <button
          onClick={() => {
            setUser({ email: 'admin@brightloop.com', role: 'admin' });
            setView('app');
          }}
          className="bg-slate-800 border border-slate-700 hover:border-indigo-500 text-indigo-400 text-sm font-semibold px-6 py-3 rounded-xl transition cursor-pointer"
        >
          Launch Dashboard Preview Mode
        </button>
      </main>
    </div>
  );
}