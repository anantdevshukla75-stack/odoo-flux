import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient.js';
import {
  login as loginRequest,
  register as registerRequest,
  logout as logoutRequest,
  restoreSession
} from '../services/authService.js';
import { ROLES } from '../utils/roleHelpers.js';

const AuthContext = createContext(null);

const CURRENT_USER_KEY = 'bl_current_user';

function readStoredUser() {
  const savedUser = localStorage.getItem(CURRENT_USER_KEY);
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(() => apiClient.hasToken());

  useEffect(() => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!apiClient.hasToken()) {
        if (!cancelled) {
          setUser(null);
          setInitializing(false);
        }
        return;
      }

      const restored = await restoreSession();
      if (!cancelled) {
        setUser(restored);
        setInitializing(false);
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    apiClient.onUnauthorized = () => setUser(null);

    return () => {
      apiClient.onUnauthorized = null;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const authenticated = await loginRequest(email, password);
      setUser(authenticated);
      return { success: true, user: authenticated };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    try {
      const authenticated = await registerRequest(formData);
      setUser(authenticated);
      return { success: true, user: authenticated };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || ROLES.CUSTOMER,
        isDemoMode,
        loading,
        initializing,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
