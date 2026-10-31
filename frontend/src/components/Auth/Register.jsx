import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });

  const [errors, setErrors] = useState([]);

  // Password Policy Rules
  const validatePassword = (pwd) => {
    const errs = [];
    if (pwd.length <= 8) errs.push("Must be more than 8 characters");
    if (!/[A-Z]/.test(pwd)) errs.push("At least one uppercase letter");
    if (!/[a-z]/.test(pwd)) errs.push("At least one lowercase letter");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errs.push("At least one special character");
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pwdErrors = validatePassword(formData.password);
    if (formData.password !== formData.confirmPassword) {
      pwdErrors.push("Passwords do not match");
    }

    if (pwdErrors.length > 0) {
      setErrors(pwdErrors);
      return;
    }

    setErrors([]);
    alert(`Account created successfully for ${formData.email} as [${formData.role.toUpperCase()}]!`);
    onSwitchToLogin();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1">Brightloop Subscription Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="user@brightloop.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {formData.password && (
            <div className="bg-slate-900/60 p-3 rounded-lg text-xs space-y-1 border border-slate-700/50">
              <p className="font-semibold text-slate-400 mb-1">Password Requirements:</p>
              <div className="flex items-center space-x-2">
                {formData.password.length > 8 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-500" />}
                <span className={formData.password.length > 8 ? "text-emerald-400" : "text-slate-500"}>More than 8 characters</span>
              </div>
              <div className="flex items-center space-x-2">
                {/[A-Z]/.test(formData.password) ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-500" />}
                <span className={/[A-Z]/.test(formData.password) ? "text-emerald-400" : "text-slate-500"}>At least 1 uppercase letter</span>
              </div>
              <div className="flex items-center space-x-2">
                {/[a-z]/.test(formData.password) ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-500" />}
                <span className={/[a-z]/.test(formData.password) ? "text-emerald-400" : "text-slate-500"}>At least 1 lowercase letter</span>
              </div>
              <div className="flex items-center space-x-2">
                {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-500" />}
                <span className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "text-emerald-400" : "text-slate-500"}>At least 1 special character</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Access Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
            >
              <option value="customer">Customer (Portal View)</option>
              <option value="staff">Internal Staff (Ops View)</option>
              <option value="admin">System Admin (Full Control)</option>
            </select>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg space-y-1">
              {errors.map((err, idx) => (
                <p key={idx}>• {err}</p>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition text-sm shadow-lg shadow-indigo-600/30 mt-2"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-indigo-400 hover:underline font-semibold">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}