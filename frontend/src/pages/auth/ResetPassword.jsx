import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, X, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { authService } from '../../services/authService.js';

export function ResetPassword() {
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password rules validation (Backend requires min 8 characters)
  const rules = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordValid = rules.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Please provide a valid password reset token.');
      return;
    }

    if (password.length < 8) {
      setError('New password must contain at least 8 characters.');
      return;
    }

    if (password.length > 128) {
      setError('New password must not exceed 128 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Connect to real POST /auth/reset-password (returns HTTP 204 No Content)
      await authService.resetPassword(token, password);
      setSubmitted(true);
    } catch (err) {
      if (err.status === 400) {
        setError('The password reset token is invalid or has expired (30-minute validity). Please request a new recovery link.');
      } else if (err.status === 422) {
        setError(err.message || 'Validation error: please ensure your password meets security criteria.');
      } else {
        setError(err.message || 'Unable to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
                Your credentials have been updated in the system database. You can now access your dashboard using your new password.
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
                placeholder="Enter reset token"
                helperText="Supplied from administrative reset dispatch"
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

              {/* Password Requirement Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="text-slate-500 font-semibold mb-1">Password Requirements:</div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {rules.length ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Minimum 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {rules.hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.hasLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {rules.hasLower ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {rules.hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Special character</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!isPasswordValid}
                className="w-full py-2.5 mt-2"
              >
                Update Password
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
