import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, ShieldCheck, UserCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES, getRoleBadgeClass } from '../../utils/roleHelpers.js';

const ROLE_ICONS = {
  [ROLES.ADMIN]: ShieldCheck,
  [ROLES.STAFF]: UserCheck,
  [ROLES.CUSTOMER]: User
};

export function Header({ onToggleMobile }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const RoleIcon = ROLE_ICONS[role] || User;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Current User */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className={`badge ${getRoleBadgeClass(role)} inline-flex items-center gap-1.5`}>
          <RoleIcon className="w-3.5 h-3.5" />
          {role}
        </span>

        <span className="hidden sm:inline-block text-xs font-medium text-slate-600">
          {user?.fullName || user?.email || 'Signed in'}
        </span>
      </div>

      {/* Right: Sign out */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
