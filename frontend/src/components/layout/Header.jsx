import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, ShieldCheck, UserCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../utils/roleHelpers.js';

export function Header({ onToggleMobile }) {
  const { user, role, switchDemoRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (newRole) => {
    switchDemoRole(newRole);
    if (newRole === ROLES.ADMIN) {
      navigate('/admin/dashboard');
    } else if (newRole === ROLES.STAFF) {
      navigate('/staff/dashboard');
    } else {
      navigate('/customer/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Demo Badge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>DEMO MODE</span>
        </div>

        <span className="hidden sm:inline-block text-xs text-slate-400">|</span>

        <span className="hidden sm:inline-block text-xs font-medium text-slate-600">
          Viewing as <strong className="text-slate-900 font-semibold">{role}</strong>
        </span>
      </div>

      {/* Right: Quick Role Switcher & User Exit */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher Pills */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => handleRoleChange(ROLES.ADMIN)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              role === ROLES.ADMIN
                ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange(ROLES.STAFF)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              role === ROLES.STAFF
                ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange(ROLES.CUSTOMER)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              role === ROLES.CUSTOMER
                ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer
          </button>
        </div>

        {/* Exit Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out / Return to Login"
          className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
