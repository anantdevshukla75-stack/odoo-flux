import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
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
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.svg"
            alt="Brightloop Software"
            style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem' }}
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Reset Password
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            We'll send you instructions to reset your password
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--success-light)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <CheckCircle2 style={{ width: '28px', height: '28px' }} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Check Your Inbox
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                If an account exists for <strong>{email}</strong>, a password reset link has been dispatched.
              </p>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.625rem' }}
              >
                Send Reset Link
              </Button>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <Link
                  to="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <ArrowLeft style={{ width: '14px', height: '14px' }} />
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

export default ForgotPasswordPage;
