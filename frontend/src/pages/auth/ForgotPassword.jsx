import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { authService } from '../../services/authService.js';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Connect to real POST /auth/forgot-password (returns HTTP 202 Accepted)
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      if (err.status === 422) {
        setError('Please enter a valid email address.');
      } else {
        // Even if connection fails, provide safe feedback or report server issue
        setError(err.message || 'Unable to process password reset request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <img src="/logo.svg" alt="Brightloop Logo" className="w-12 h-12 mx-auto rounded-xl shadow-xs" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Reset Password
          </h2>
          <p className="text-sm text-slate-500">
            Submit your corporate email address to request account recovery
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Password Recovery Logged
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an account exists for <strong className="text-slate-800">{email}</strong>, a password reset request has been recorded. In the current development environment, reset token dispatch is managed by your system administrator.
              </p>
              <div className="pt-3 flex flex-col gap-2">
                <Link to="/reset-password">
                  <Button variant="primary" className="w-full">
                    Enter Reset Token
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full py-2.5 mt-2"
              >
                Request Password Reset
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
