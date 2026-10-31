import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../data/demoData.js';
import { ROLES } from '../utils/roleHelpers.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
  
  // Load saved user or default to DEMO Admin
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('bl_current_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // Fallback
      }
    }
    return DEMO_USERS.admin;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bl_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bl_current_user');
    }
  }, [user]);

  // Switch demo roles instantly
  const switchDemoRole = (roleKey) => {
    const key = (roleKey || '').toLowerCase();
    const newUser = DEMO_USERS[key] || DEMO_USERS.admin;
    setUser(newUser);
    return newUser;
  };

  // Standard login simulation
  const login = async (email, password) => {
    setLoading(true);
    try {
      // Find matching demo user or fallback
      const found = Object.values(DEMO_USERS).find(
        u => u.email.toLowerCase() === email.toLowerCase()
      );

      if (found) {
        setUser(found);
        return { success: true, user: found };
      }

      // Default mock login
      const fallbackUser = {
        id: `usr-${Date.now()}`,
        fullName: email.split('@')[0],
        email: email,
        role: ROLES.CUSTOMER,
        isActive: true
      };
      setUser(fallbackUser);
      return { success: true, user: fallbackUser };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || ROLES.CUSTOMER,
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

