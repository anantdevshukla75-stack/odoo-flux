import React from 'react';
import { UserCheck, Shield } from 'lucide-react';

export default function TopHeader({ user, activeRole, onRoleSwitch }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <h2 className="text-sm font-semibold text-slate-300">Workspace Switcher:</h2>
        
        {/* Interactive Role Switcher for testing all 3 user perspectives */}
        <div className="bg-slate-800 p-1 rounded-lg border border-slate-700/80 flex space-x-1">
          {['admin', 'staff', 'customer'].map((role) => (
            <button
              key={role}
              onClick={() => onRoleSwitch(role)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition cursor-pointer ${
                activeRole === role
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-xs bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-full">
          <Shield className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-slate-300 font-medium">{user?.email || 'admin@brightloop.com'}</span>
        </div>
      </div>
    </header>
  );
}