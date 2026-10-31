import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, User, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../utils/roleHelpers.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

export function LoginPage() {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@brightloopsoftware.com');
  const [password, setPassword] = useState('BrightAdmin@2026!');
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
      setError('Invalid credentials. Please select one of the Demo Access options below.');
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--background)',
        padding: '2rem 1rem'
      }}
    >
      <div style={{ maxWidth: '460px', width: '100%' }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.svg"
            alt="Brightloop Software"
            style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem' }}
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Brightloop Software
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Subscription Billing & Financial Operations Platform
          </p>
        </div>

        {/* Demo Notice Banner */}
        <div
          style={{
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.8125rem',
            color: '#92400E'
          }}
        >
          <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Interactive Preview Environment:</strong> You can sign in using standard credentials or use the instant One-Click Demo Role triggers below to inspect each stakeholder's portal.
          </div>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            Sign In to Account
          </h3>

          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                marginBottom: '1rem'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleStandardLogin}>
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                fontSize: '0.8125rem'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Remember session</span>
              </label>
              <Link to="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', padding: '0.625rem' }}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Role Cards */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                marginBottom: '0.75rem',
                textAlign: 'center'
              }}
            >
              Instant Demo Access
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #C7D2FE',
                  background: '#EEF2FF'
                }}
                onClick={() => handleQuickDemoAccess(ROLES.ADMIN)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Administrator</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Preview <ArrowRight style={{ width: '12px', height: '12px' }} />
                </span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem'
                }}
                onClick={() => handleQuickDemoAccess(ROLES.STAFF)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck style={{ width: '16px', height: '16px', color: 'var(--info)' }} />
                  <span style={{ fontWeight: 600 }}>Operations Staff</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Preview <ArrowRight style={{ width: '12px', height: '12px' }} />
                </span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem'
                }}
                onClick={() => handleQuickDemoAccess(ROLES.CUSTOMER)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User style={{ width: '16px', height: '16px', color: 'var(--success)' }} />
                  <span style={{ fontWeight: 600 }}>Customer Portal</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Preview <ArrowRight style={{ width: '12px', height: '12px' }} />
                </span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem' }}>
            <span>Need an account? </span>
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Register as Customer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
