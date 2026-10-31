import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, X, ShieldAlert } from 'lucide-react';
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

  // Real-time password criteria validation (Backend requires 8-128 chars; recommended complexity)
  const rules = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordValid = rules.length;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password.length > 128) {
      setError('Password must not exceed 128 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Register with confirmed backend schema (email, password, full_name)
      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      });
      navigate('/customer/dashboard');
    } catch (err) {
      if (err.status === 409) {
        setError('This email address is already registered. Please sign in instead.');
      } else if (err.status === 422) {
        setError(err.message || 'Validation error: please supply a valid email and 8+ character password.');
      } else {
        setError(err.message || 'Registration could not be completed. Please try again.');
      }
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
                placeholder="Marcus Vance"
                required
              />

              <Input
                label="Corporate Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="m.vance@acmecorp.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Company Legal Name (Optional)"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Acme Enterprise Inc."
              />

              <Input
                label="Phone Number (Optional)"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 019-2834"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Password Requirement Checklist */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 mt-2">
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
              className="w-full py-2.5 mt-4"
            >
              Register & Launch Portal
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign In to workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
