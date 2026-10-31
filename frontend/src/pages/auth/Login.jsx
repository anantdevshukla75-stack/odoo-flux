import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  User,
  ArrowRight,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';
import { ROLES } from '../../utils/roleHelpers.js';
import { DEMO_ACCOUNTS } from '../../services/authService.js';

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState(null);
  const [error, setError] = useState('');

  // Find demo account definitions
  const adminAccount = DEMO_ACCOUNTS.find(a => a.role === ROLES.ADMIN) || {
    role: 'ADMIN',
    label: 'Continue as Admin',
    description: 'Full business & catalog management',
    email: 'admin@odooflux.local',
    password: 'Password123!'
  };

  const staffAccount = DEMO_ACCOUNTS.find(a => a.role === ROLES.STAFF) || {
    role: 'STAFF',
    label: 'Continue as Staff',
    description: 'Customers, subscriptions & billing',
    email: 'staff@odooflux.local',
    password: 'Password123!'
  };

  const customerAccount = DEMO_ACCOUNTS.find(a => a.role === ROLES.CUSTOMER) || {
    role: 'CUSTOMER',
    label: 'Continue as Customer',
    description: 'Self-service subscriptions & invoices',
    email: 'customer@odooflux.local',
    password: 'Password123!'
  };

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
      setActiveQuickRole(null);
    }
  };

  const handleStandardLogin = (e) => {
    e.preventDefault();
    signIn({ email, password });
  };

  const handleQuickDemoAccess = (account) => {
    setActiveQuickRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    signIn(account);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden select-none bg-gradient-to-br from-[#eaf2ff] via-[#edf2fe] to-[#e6f4fe]">
      {/* --- Pure CSS Custom Keyframes & Glassmorphic Utilities --- */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-15px, -25px) scale(1.04);
          }
        }

        @keyframes floatReverse {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, -20px) scale(1.03);
          }
        }

        @keyframes floatCard {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes floatCardReverse {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(7px);
          }
        }

        @keyframes ringSpin {
          0% {
            transform: rotateX(65deg) rotateY(25deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(65deg) rotateY(25deg) rotateZ(360deg);
          }
        }

        @keyframes ringSpinReverse {
          0% {
            transform: rotateX(60deg) rotateY(-30deg) rotateZ(360deg);
          }
          100% {
            transform: rotateX(60deg) rotateY(-30deg) rotateZ(0deg);
          }
        }

        @keyframes entranceFadeUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes entranceFadeLeft {
          from {
            opacity: 0;
            transform: translateX(-35px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes entranceFadeRight {
          from {
            opacity: 0;
            transform: translateX(35px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulseSoft {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.08);
          }
        }

        .anim-orb-purple {
          animation: floatSlow 12s ease-in-out infinite;
        }

        .anim-orb-blue {
          animation: floatReverse 14s ease-in-out infinite;
        }

        .anim-ring-1 {
          animation: ringSpin 26s linear infinite;
        }

        .anim-ring-2 {
          animation: ringSpinReverse 22s linear infinite;
        }

        .anim-card-float {
          animation: floatCard 4.8s ease-in-out infinite;
        }

        .anim-card-float-reverse {
          animation: floatCardReverse 5.2s ease-in-out infinite;
        }

        .anim-entrance-center {
          animation: entranceFadeUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .anim-entrance-left {
          animation: entranceFadeLeft 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
        }

        .anim-entrance-right-1 {
          animation: entranceFadeRight 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .anim-entrance-right-2 {
          animation: entranceFadeRight 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }

        .anim-logo-pulse {
          animation: pulseSoft 4s ease-in-out infinite;
        }

        /* Pure CSS 3D Glass Sphere Styles */
        .glass-orb-purple {
          background: radial-gradient(circle at 35% 30%, #f3e8ff 0%, #c084fc 25%, #9333ea 60%, #6b21a8 85%, #581c87 100%);
          box-shadow:
            inset -15px -15px 35px rgba(0, 0, 0, 0.25),
            inset 15px 15px 35px rgba(255, 255, 255, 0.85),
            0 25px 60px rgba(147, 51, 234, 0.25);
        }

        .glass-orb-blue {
          background: radial-gradient(circle at 35% 30%, #e0f2fe 0%, #7dd3fc 25%, #38bdf8 50%, #0284c7 80%, #0369a1 100%);
          box-shadow:
            inset -15px -15px 35px rgba(0, 0, 0, 0.2),
            inset 15px 15px 35px rgba(255, 255, 255, 0.9),
            0 25px 60px rgba(14, 165, 233, 0.25);
        }

        .glass-orb-cyan {
          background: radial-gradient(circle at 32% 28%, #ecfeff 0%, #67e8f9 35%, #06b6d4 70%, #0891b2 100%);
          box-shadow:
            inset -8px -8px 20px rgba(0, 0, 0, 0.2),
            inset 8px 8px 20px rgba(255, 255, 255, 0.8),
            0 15px 35px rgba(6, 182, 212, 0.3);
        }

        .glass-orb-magenta {
          background: radial-gradient(circle at 32% 28%, #fae8ff 0%, #e879f9 35%, #c026d3 70%, #86198f 100%);
          box-shadow:
            inset -8px -8px 20px rgba(0, 0, 0, 0.2),
            inset 8px 8px 20px rgba(255, 255, 255, 0.8),
            0 15px 35px rgba(192, 38, 211, 0.3);
        }

        /* Dot Pattern Grid Matrix */
        .bg-grid-dots {
          background-image: radial-gradient(rgba(99, 102, 241, 0.16) 1.2px, transparent 1.2px);
          background-size: 26px 26px;
        }
      `}</style>

      {/* --- Pure CSS 3D Atmospheric Background (Matching Uploaded Image) --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Subtle Tech Dot Matrix Grid Overlay */}
        <div className="absolute inset-0 bg-grid-dots opacity-60" />

        {/* Ambient Soft Radial Light Glows */}
        <div className="absolute top-[12%] left-[18%] w-[38rem] h-[38rem] rounded-full bg-purple-300/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[10%] right-[15%] w-[42rem] h-[42rem] rounded-full bg-sky-300/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-white/90 via-white/40 to-transparent pointer-events-none" />

        {/* 1. Large Pearlescent Violet Sphere (Left side behind Admin card) */}
        <div className="absolute top-[22%] left-[-4%] sm:left-[2%] md:left-[5%] lg:left-[8%] xl:left-[11%] w-72 h-72 lg:w-96 lg:h-96 rounded-full glass-orb-purple anim-orb-purple opacity-90" />

        {/* Orbiting Curved Glass Ring around Violet Sphere */}
        <div
          className="absolute top-[20%] left-[-6%] sm:left-[0%] md:left-[3%] lg:left-[6%] xl:left-[9%] w-[22rem] h-[22rem] lg:w-[28rem] lg:h-[28rem] rounded-full border-[3px] border-white/60 anim-ring-1 pointer-events-none"
          style={{
            boxShadow: '0 0 25px rgba(255, 255, 255, 0.7), inset 0 0 20px rgba(192, 132, 252, 0.4)'
          }}
        />

        {/* 2. Glossy Sky-Blue Sphere (Right side top) */}
        <div className="absolute top-[10%] right-[-6%] sm:right-[1%] md:right-[4%] lg:right-[6%] xl:right-[8%] w-60 h-60 lg:w-80 lg:h-80 rounded-full glass-orb-blue anim-orb-blue opacity-90" />

        {/* Orbiting Curved Glass Ring around Blue Sphere */}
        <div
          className="absolute top-[8%] right-[-8%] sm:right-[-1%] md:right-[2%] lg:right-[4%] xl:right-[6%] w-[18rem] h-[18rem] lg:w-[24rem] lg:h-[24rem] rounded-full border-[2.5px] border-white/65 anim-ring-2 pointer-events-none"
          style={{
            boxShadow: '0 0 25px rgba(255, 255, 255, 0.7), inset 0 0 20px rgba(56, 189, 248, 0.4)'
          }}
        />

        {/* 3. Floating Accent Beads (Matching image foreground specular beads) */}
        {/* - Bottom Left (glossy cyan orb) */}
        <div className="absolute bottom-[8%] left-[8%] sm:left-[14%] w-20 h-20 sm:w-24 sm:h-24 rounded-full glass-orb-cyan anim-orb-purple" />

        {/* - Far Bottom Left (deep purple bead) */}
        <div className="absolute bottom-[22%] left-[2%] sm:left-[6%] w-12 h-12 rounded-full glass-orb-purple anim-orb-blue opacity-75" />

        {/* - Bottom Right (vibrant magenta bead) */}
        <div className="absolute bottom-[6%] right-[8%] sm:right-[12%] w-20 h-20 sm:w-28 sm:h-28 rounded-full glass-orb-magenta anim-orb-blue" />

        {/* - Upper Right Small Cyan Bead */}
        <div className="absolute top-[18%] right-[28%] sm:right-[32%] w-10 h-10 rounded-full glass-orb-cyan anim-orb-purple opacity-80" />
      </div>

      {/* --- Main Content Stage --- */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8 flex flex-col items-center">
          {/* Glowing App Icon matching uploaded image */}
          <div className="relative mb-3 group">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-60 blur-md anim-logo-pulse" />
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#38bdf8] via-[#4f46e5] to-[#7c3aed] flex items-center justify-center shadow-lg border border-white/70 p-2.5 transition-transform duration-300 hover:scale-105">
              <svg viewBox="0 0 40 40" fill="none" className="w-full h-full drop-shadow">
                <path
                  d="M12 20C12 15.58 15.58 12 20 12C24.42 12 28 15.58 28 20C28 24.42 24.42 28 20 28"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <circle cx="20" cy="20" r="3.2" fill="#38BDF8" />
                <path
                  d="M28 20C28 17.5 25.5 15.5 23 17"
                  stroke="#38BDF8"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 drop-shadow-xs">
            Brightloop Software
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Subscription Management & Revenue Operations Platform
          </p>
        </div>

        {/* --- 3-Column Hero Grid matching uploaded image --- */}
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-center justify-center gap-6 lg:gap-6 xl:gap-8">
          {/* --- LEFT CARD: Continue as Admin --- */}
          <div
            onClick={() => !loading && handleQuickDemoAccess(adminAccount)}
            className="anim-entrance-left w-full max-w-sm lg:w-[19rem] xl:w-80 group cursor-pointer bg-white/75 backdrop-blur-xl rounded-3xl border border-white/85 p-6 shadow-[0_20px_50px_rgba(79,70,229,0.12)] hover:shadow-[0_28px_65px_rgba(79,70,229,0.24)] hover:border-indigo-300 hover:-translate-y-2 transition-all duration-300 anim-card-float flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                {/* Purple Shield Icon Badge */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/25 text-white transition-transform duration-300 group-hover:scale-110">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                    Demo Only
                  </span>
                  {/* Arrow Pill */}
                  <div className="w-8 h-8 rounded-full bg-white/90 border border-slate-150 flex items-center justify-center text-indigo-600 shadow-xs group-hover:bg-indigo-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Continue as Admin
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Full business & catalog management
                </p>
                <div className="mt-2 text-[11px] font-mono text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span>admin@odooflux.local</span>
                  <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-indigo-500">Demo Role</span>
                </div>
              </div>

              {/* Feature Bullets */}
              <div className="mt-4 pt-3.5 border-t border-slate-100/90 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <div className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600">
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                  <span>Manage products & plans</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <div className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600">
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                  <span>Oversee customers</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <div className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-600">
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                  <span>Track revenue & analytics</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
              <span>Login credentials provided for demo purposes only</span>
            </div>

            {activeQuickRole === ROLES.ADMIN && loading && (
              <div className="mt-2 text-center text-xs font-semibold text-indigo-600 animate-pulse">
                Signing in as Admin...
              </div>
            )}
          </div>

          {/* --- CENTER CARD: Main Sign In Form --- */}
          <div className="anim-entrance-center w-full max-w-sm sm:max-w-md lg:w-[26rem] xl:w-[28rem] bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/95 p-6 sm:p-8 shadow-[0_25px_60px_rgba(30,41,59,0.12)] hover:shadow-[0_30px_70px_rgba(30,41,59,0.18)] transition-all duration-300">
            {/* Demo Environment Amber Notice */}
            <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 mb-5 leading-relaxed shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Demo environment:</strong> Pre-configured card credentials are for <span className="font-semibold underline decoration-amber-400">demonstration purposes only</span>. Default password: <code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded text-amber-950 font-bold">Password123!</code>.
              </div>
            </div>

            {/* Card Titles */}
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Sign In to your workspace
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Access your subscription management dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50/90 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleStandardLogin} className="space-y-4">
              {/* Work Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@odooflux.local"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white/90 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all duration-200 shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/90 bg-white/90 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all duration-200 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Vibrant Gradient Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-400 hover:from-indigo-500 hover:via-blue-500 hover:to-teal-300 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading && !activeQuickRole ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <span className="bg-white/95 px-3 rounded-full">OR</span>
              </div>
            </div>

            {/* Bottom Register Link */}
            <div className="text-center text-xs text-slate-500">
              Don't have an enterprise account?{' '}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
              >
                Register as Customer
              </Link>
            </div>
          </div>

          {/* --- RIGHT CARDS: Stacked Staff & Customer Cards --- */}
          <div className="w-full max-w-sm lg:w-[19rem] xl:w-80 flex flex-col gap-4">
            {/* Top: Continue as Staff */}
            <div
              onClick={() => !loading && handleQuickDemoAccess(staffAccount)}
              className="anim-entrance-right-1 group cursor-pointer bg-white/75 backdrop-blur-xl rounded-3xl border border-white/85 p-5 shadow-[0_15px_35px_rgba(14,165,233,0.1)] hover:shadow-[0_24px_50px_rgba(14,165,233,0.22)] hover:border-sky-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between anim-card-float-reverse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Sky Blue Users Icon Badge */}
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/25 text-white shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                      Continue as Staff
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customers, subscriptions & billing
                    </p>
                  </div>
                </div>
                {/* Arrow Pill */}
                <div className="w-7 h-7 rounded-full bg-white/90 border border-slate-150 flex items-center justify-center text-sky-600 shadow-xs group-hover:bg-sky-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
                <span className="font-mono text-sky-700 bg-sky-50/80 px-2 py-0.5 rounded border border-sky-100">
                  staff@odooflux.local
                </span>
                <span className="text-slate-400 font-medium">Demo purpose only</span>
              </div>
            </div>

            {/* Bottom: Continue as Customer */}
            <div
              onClick={() => !loading && handleQuickDemoAccess(customerAccount)}
              className="anim-entrance-right-2 group cursor-pointer bg-white/75 backdrop-blur-xl rounded-3xl border border-white/85 p-5 shadow-[0_15px_35px_rgba(16,185,129,0.1)] hover:shadow-[0_24px_50px_rgba(16,185,129,0.22)] hover:border-emerald-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between anim-card-float"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Emerald User Icon Badge */}
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25 text-white shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Continue as Customer
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Self-service subscriptions & invoices
                    </p>
                  </div>
                </div>
                {/* Arrow Pill */}
                <div className="w-7 h-7 rounded-full bg-white/90 border border-slate-150 flex items-center justify-center text-emerald-600 shadow-xs group-hover:bg-emerald-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
                <span className="font-mono text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">
                  customer@odooflux.local
                </span>
                <span className="text-slate-400 font-medium">Demo purpose only</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
