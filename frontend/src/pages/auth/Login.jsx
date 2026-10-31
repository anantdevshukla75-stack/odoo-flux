import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../utils/roleHelpers.js';
import { DEMO_ACCOUNTS } from '../../services/authService.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

const ROLE_ICONS = {
  [ROLES.ADMIN]: ShieldCheck,
  [ROLES.STAFF]: UserCheck,
  [ROLES.CUSTOMER]: User
};

const ROLE_STYLES = {
  [ROLES.ADMIN]: {
    button: 'border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-950',
    icon: 'bg-indigo-600 text-white',
    title: 'text-indigo-950',
    subtitle: 'text-indigo-700',
    arrow: 'text-indigo-600'
  },
  [ROLES.STAFF]: {
    button: 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
    icon: 'bg-sky-600 text-white',
    title: 'text-slate-900',
    subtitle: 'text-slate-500',
    arrow: 'text-slate-400'
  },
  [ROLES.CUSTOMER]: {
    button: 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
    icon: 'bg-emerald-600 text-white',
    title: 'text-slate-900',
    subtitle: 'text-slate-500',
    arrow: 'text-slate-400'
  }
};

function landingPath(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard';
  if (role === ROLES.STAFF) return '/staff/dashboard';
  return '/customer/dashboard';
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@odooflux.local');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signIn = async (credentials) => {
    setError('');
    setLoading(true);

    try {
      const res = await login(credentials.email, credentials.password);
      navigate(landingPath(res.user.role));
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStandardLogin = (e) => {
    e.preventDefault();
    signIn({ email, password });
  };

  const handleQuickDemoAccess = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    signIn(account);
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

        {/* Demo credentials notice */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold">Demo environment:</strong> seeded accounts use the password{' '}
            <code className="font-mono">Password123!</code>. Pick a role below to sign in instantly.
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
              Seeded Demo Accounts
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = ROLE_ICONS[account.role];
                const styles = ROLE_STYLES[account.role];

                return (
                  <button
                    key={account.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickDemoAccess(account)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border transition-colors text-left disabled:opacity-60 ${styles.button}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${styles.icon}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${styles.title}`}>{account.label}</div>
                        <div className={`text-[10px] ${styles.subtitle}`}>{account.description}</div>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${styles.arrow}`} />
                  </button>
                );
              })}
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
