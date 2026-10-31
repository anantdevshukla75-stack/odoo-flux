import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, X, Building, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
    taxId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const password = formData.password;

  // Real-time password criteria validation
  const rules = {
    length: password.length > 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please satisfy all password complexity rules before proceeding.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        phone: formData.phone,
        taxId: formData.taxId
      });
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err?.message || 'Registration could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <img src="/logo.svg" alt="Brightloop Logo" className="w-12 h-12 mx-auto rounded-xl shadow-xs" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Customer Account
          </h2>
          <p className="text-sm text-slate-500">
            Register your enterprise for self-service subscription management
          </p>
        </div>

        {/* Security Role Notice */}
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
          <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Public registrations are automatically provisioned with the <strong>Customer Portal</strong> role.</span>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Marcus Sterling"
                required
              />

              <Input
                label="Corporate Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="marcus@company.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Acme Technologies"
              />

              <Input
                label="Contact Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Password Validation Checklist */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 text-xs">
              <div className="font-semibold text-slate-600 mb-1">Password Requirements:</div>
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
                <span>At least one special character (!@#$%^&*)</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-2.5 mt-2"
            >
              Complete Registration
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

