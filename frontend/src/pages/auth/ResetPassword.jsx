import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, X, CheckCircle2, Lock } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

export function ResetPassword() {
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') || 'demo-reset-token-2026');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password rules validation
  const rules = {
    length: password.length > 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please satisfy all password complexity rules before proceeding.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <img src="/logo.svg" alt="Brightloop Logo" className="w-12 h-12 mx-auto rounded-xl shadow-xs" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Set New Password
          </h2>
          <p className="text-sm text-slate-500">
            Secure your Brightloop workspace account with a new password
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Password Successfully Reset
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your credentials have been updated. You can now access your dashboard using your new password.
              </p>
              <Link to="/login" className="block pt-2">
                <Button variant="primary" className="w-full">
                  Sign In Now
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <Input
                label="Security Reset Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token"
                helperText="Pre-filled from reset email link"
                required
              />

              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {/* Password Requirements */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 text-xs">
                <div className="font-semibold text-slate-600 mb-1">Complexity Requirements:</div>
                <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  {rules.length ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>More than 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${rules.hasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  {rules.hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${rules.hasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  {rules.hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${rules.hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  {rules.hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one special character</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full py-2.5 mt-2"
              >
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

