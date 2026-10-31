import React from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ADMIN_NAVIGATION,
  STAFF_NAVIGATION,
  CUSTOMER_NAVIGATION
} from '../../data/navigation.js';
import { ROLES } from '../../utils/roleHelpers.js';

export function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { user, role } = useAuth();

  let navSections = [];
  if (role === ROLES.ADMIN) {
    navSections = ADMIN_NAVIGATION;
  } else if (role === ROLES.STAFF) {
    navSections = STAFF_NAVIGATION;
  } else {
    navSections = CUSTOMER_NAVIGATION;
  }

  const renderIcon = (iconName) => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.Circle;
    return <IconComponent className="w-4 h-4 shrink-0" />;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-gray-900 text-slate-400 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Brightloop Logo" className="w-8 h-8 rounded-lg shrink-0" />
            <div>
              <div className="text-sm font-bold text-white tracking-tight leading-none">
                Brightloop
              </div>
              <div className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                Subscriptions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              {role}
            </span>
            {/* Close Button on Mobile */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {section.section}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-400 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      {renderIcon(item.icon)}
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* User Card in Footer */}
        <div className="p-3 border-t border-gray-800 bg-gray-900/40">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
            <div className="w-8 h-8 rounded-full bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {user?.fullName || 'User'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.companyName || user?.email || role}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
