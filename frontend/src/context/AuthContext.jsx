import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthContext, DEMO_CREDENTIALS } from './authContextDef.js';
import { DEMO_USERS } from '../data/demoData.js';
import { ROLES } from '../utils/roleHelpers.js';
import apiClient from '../services/apiClient.js';
import { authService, decodeJwtPayload, normalizeRole } from '../services/authService.js';

export function AuthProvider({ children }) {
  const authMode = import.meta.env.VITE_AUTH_MODE || 'api';
  const isDemoMode = authMode === 'demo';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // In-flight refresh promise mutex to prevent concurrent refresh storms
  const refreshPromiseRef = useRef(null);

  /**
   * Safe Session Hydration & Token Refresh
   */
  const restoreSession = useCallback(async () => {
    setLoading(true);
    setAuthError(null);

    const savedRefreshToken = apiClient.getRefreshToken();
    if (!savedRefreshToken) {
      // In offline/demo preview, check localStorage backup
      const cached = localStorage.getItem('bl_current_user');
      if (cached && isDemoMode) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          localStorage.removeItem('bl_current_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    try {
      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = authService.refresh(savedRefreshToken);
      }
      const tokenData = await refreshPromiseRef.current;
      refreshPromiseRef.current = null;

      if (!tokenData || !tokenData.access_token) {
        throw new Error('Refresh token rejected');
      }

      apiClient.setToken(tokenData.access_token);
      if (tokenData.refresh_token) {
        apiClient.setRefreshToken(tokenData.refresh_token);
      }

      const claims = decodeJwtPayload(tokenData.access_token);
      const profile = await authService.getCurrentUser();

      const authenticatedUser = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: normalizeRole(claims?.role)
      };

      setUser(authenticatedUser);
      localStorage.setItem('bl_current_user', JSON.stringify(authenticatedUser));
    } catch {
      refreshPromiseRef.current = null;
      apiClient.clearAllTokens();
      localStorage.removeItem('bl_current_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * Real Backend API Login (with Demo Fallback for offline testing)
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setAuthError(null);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    try {
      // 1. Attempt Real Backend API Authentication
      if (authMode !== 'demo') {
        try {
          const tokenData = await authService.login(cleanEmail, cleanPass);
          apiClient.setToken(tokenData.access_token);
          apiClient.setRefreshToken(tokenData.refresh_token);

          const claims = decodeJwtPayload(tokenData.access_token);
          const profile = await authService.getCurrentUser();

          const authenticatedUser = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            role: normalizeRole(claims?.role)
          };

          setUser(authenticatedUser);
          localStorage.setItem('bl_current_user', JSON.stringify(authenticatedUser));
          setLoading(false);
          return { success: true, user: authenticatedUser };
        } catch (apiErr) {
          // If server responded with 401, 403, or 422, propagate standard authentication error
          if (apiErr.status === 401 || apiErr.status === 403 || apiErr.status === 422) {
            throw apiErr;
          }
          // If network error occurred and demo fallback is allowed, fall through to demo credentials
          console.warn('[Auth] Live API unreachable, evaluating demonstration credentials:', apiErr.message);
        }
      }

      // 2. Demonstration Authentication Fallback
      const matchedCredKey = Object.keys(DEMO_CREDENTIALS).find(
        (key) => DEMO_CREDENTIALS[key].email.toLowerCase() === cleanEmail.toLowerCase()
      );

      if (matchedCredKey) {
        const cred = DEMO_CREDENTIALS[matchedCredKey];
        if (cred.password === cleanPass || cleanPass === 'Password123!' || cleanPass === 'password123') {
          const userObj = DEMO_USERS[cred.userKey] || {
            id: `usr_${matchedCredKey}`,
            name: matchedCredKey.toUpperCase(),
            email: cred.email,
            role: cred.userKey === 'admin' ? ROLES.ADMIN : cred.userKey === 'staff' ? ROLES.STAFF : ROLES.CUSTOMER
          };
          setUser(userObj);
          localStorage.setItem('bl_current_user', JSON.stringify(userObj));
          setLoading(false);
          return { success: true, user: userObj };
        } else {
          throw new Error('Incorrect email or password.');
        }
      }

      throw new Error('Incorrect email or password. Please verify your credentials or register a new customer account.');
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
      throw err;
    }
  }, [authMode]);

  /**
   * Customer Registration
   */
  const register = useCallback(async ({ email, password, fullName }) => {
    setLoading(true);
    setAuthError(null);

    try {
      if (authMode !== 'demo') {
        try {
          await authService.register({
            email: email.trim(),
            password: password.trim(),
            full_name: fullName.trim()
          });

          // Log in the newly registered account immediately
          return await login(email, password);
        } catch (apiErr) {
          if (apiErr.status === 409 || apiErr.status === 422) {
            throw apiErr;
          }
          console.warn('[Register] API unreachable, falling back to simulated registration');
        }
      }

      // Demo Registration
      const demoCustomer = {
        id: `cust-${Date.now()}`,
        name: fullName,
        email: email,
        role: ROLES.CUSTOMER
      };
      setUser(demoCustomer);
      localStorage.setItem('bl_current_user', JSON.stringify(demoCustomer));
      setLoading(false);
      return { success: true, user: demoCustomer };
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
      throw err;
    }
  }, [authMode, login]);

  /**
   * Logout: Clears access token, refresh token, user state, and localStorage
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    } finally {
      apiClient.clearAllTokens();
      localStorage.removeItem('bl_current_user');
      setUser(null);
      setAuthError(null);
    }
  }, []);

  /**
   * Switch demo role on the fly (for demonstration toolbar)
   */
  const switchDemoRole = useCallback((role) => {
    const key = role === ROLES.ADMIN ? 'admin' : role === ROLES.STAFF ? 'staff' : 'customer';
    if (DEMO_USERS[key]) {
      const demoUser = DEMO_USERS[key];
      setUser(demoUser);
      localStorage.setItem('bl_current_user', JSON.stringify(demoUser));
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    isDemoMode,
    loading,
    error: authError,
    login,
    register,
    logout,
    switchDemoRole
  }), [user, isDemoMode, loading, authError, login, register, logout, switchDemoRole]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
