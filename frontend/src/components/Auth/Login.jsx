import React, { useState } from 'react';
import { Lock, Mail, Zap } from 'lucide-react';

export default function Login({ onSwitchToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    onLoginSuccess({ email, role: 'admin' });
  };

  const handleForgotPassword = () => {
    if (!email) {
      alert("Please enter your email address first.");
      return;
    }
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In to Brightloop</h2>
          <p className="text-slate-400 text-sm mt-1">Odoo x Flux Subscription Engine</p>
        </div>

        {resetSent && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-lg text-center">
            Password reset link sent to <strong>{email}</strong>!
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="user@brightloop.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300 uppercase">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition text-sm shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="text-indigo-400 hover:underline font-semibold cursor-pointer">
            Register Now
          </button>
        </p>
      </div>
    </div>
  );
}