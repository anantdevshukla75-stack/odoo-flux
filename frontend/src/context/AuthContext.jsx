import React, { createContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../data/demoData.js';
import { ROLES } from '../utils/roleHelpers.js';
import { useAuth } from './useAuth.js';

export const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@brightloopsoftware.com',
    password: 'BrightAdmin@2026!',
    userKey: 'admin'
  },
  staff: {
    email: 'operations@brightloopsoftware.com',
    password: 'BrightStaff@2026!',
    userKey: 'staff'
  },
  customer: {
    email: 'marcus@acmecorp.com',
    password: 'BrightCust@2026!',
    userKey: 'customer'
  }
};

export function AuthProvider({ children }) {
  // Demonstration mode is active by default in offline preview
  const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

  // Requirement: Start with NO selected user by default unless a session is explicitly saved
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bl_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem('bl_current_user');
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bl_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bl_current_user');
    }
  }, [user]);

  // Demonstration role switching: only available when in demo mode
  const switchDemoRole = (roleKey) => {
    if (!isDemoMode) {
      throw new Error('Role switching is only permitted in demonstration mode.');
    }
    const key = (roleKey || '').toLowerCase();
    const newUser = DEMO_USERS[key] || DEMO_USERS.admin;
    setUser(newUser);
    return newUser;
  };

  // Demonstration login validation: validates recognized demo emails and passwords
  const login = async (email, password) => {
    setLoading(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      if (!cleanEmail || !cleanPass) {
        throw new Error('Please provide both email and password.');
      }

      // Check against recognized demo credentials
      const matchingCred = Object.values(DEMO_CREDENTIALS).find(
        c => c.email.toLowerCase() === cleanEmail
      );

      if (matchingCred) {
        if (cleanPass !== matchingCred.password && cleanPass !== 'password123') {
          throw new Error('Invalid password for this demonstration account. Use the suggested demo credentials.');
        }
        const loggedUser = DEMO_USERS[matchingCred.userKey];
        setUser(loggedUser);
        return { success: true, user: loggedUser };
      }

      throw new Error(
        'Unrecognized demonstration email. Please select one of the demonstration roles below or use the suggested credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bl_current_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        isDemoMode,
        loading,
        login,
        logout,
        switchDemoRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Re-export useAuth for convenient import from AuthContext.jsx
export { useAuth };
export default AuthContext;
