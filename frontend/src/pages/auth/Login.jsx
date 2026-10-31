import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';
import { ROLES } from '../../utils/roleHelpers.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

export function Login() {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@odooflux.local');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.user.role === ROLES.ADMIN) {
        navigate('/admin/dashboard');
      } else if (res.user.role === ROLES.STAFF) {
        navigate('/staff/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      if (err.status === 401) {
        setError('Incorrect email or password. Please check your credentials.');
      } else if (err.status === 403) {
        setError('Account is inactive. Please contact your system administrator.');
      } else if (err.status === 422) {
        setError(err.message || 'Validation error: please supply a valid email and password.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccess = (role) => {
    switchDemoRole(role);
    if (role === ROLES.ADMIN) {
      navigate('/admin/dashboard');
    } else if (role === ROLES.STAFF) {
      navigate('/staff/dashboard');
    } else {
      navigate('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <img src="/logo.svg" alt="Brightloop Logo" className="w-12 h-12 mx-auto rounded-xl shadow-xs" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Brightloop Software
          </h2>
          <p className="text-sm text-slate-500">
            Subscription Management & Revenue Operations Platform
          </p>
        </div>

        {/* Demo Mode Notice */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold">Interactive Mode:</strong> Sign in with active backend credentials (<code className="bg-amber-100 px-1 rounded">admin@odooflux.local</code>) or choose an instant role preview below.
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Sign In to your workspace
          </h3>

          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleStandardLogin} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-2.5 mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Access Options */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Fast Demonstration Access
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickDemoAccess(ROLES.ADMIN)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-950 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-950">Continue as Admin</div>
                    <div className="text-[10px] text-indigo-700">Full business & catalog management</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoAccess(ROLES.STAFF)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Continue as Staff</div>
                    <div className="text-[10px] text-slate-500">Quotations, invoices & overdue accounts</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoAccess(ROLES.CUSTOMER)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Continue as Customer</div>
                    <div className="text-[10px] text-slate-500">Self-service proposals, subscriptions & invoices</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an enterprise account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Register as Customer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
