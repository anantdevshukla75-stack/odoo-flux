import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../utils/roleHelpers.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    billingAddress: '',
    taxId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/customer/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.svg"
            alt="Brightloop Software"
            style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem' }}
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Create Customer Account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Register your enterprise for self-service subscription management
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
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

          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
              />
              <Input
                label="Work Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@company.com"
                required
              />
            </div>

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 chars, 1 uppercase, 1 special char"
              helperText="Must contain upper & lower case, numbers, and symbols"
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Acme Corp"
              />
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <Input
              label="Tax Number / VAT ID"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              placeholder="e.g. US-TAX-123456"
            />

            <Input
              label="Billing Address"
              name="billingAddress"
              value={formData.billingAddress}
              onChange={handleChange}
              placeholder="Street address, City, Country"
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.625rem' }}
            >
              Complete Registration
            </Button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem' }}>
            <span>Already have an account? </span>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

