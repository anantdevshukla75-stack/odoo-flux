/**
 * Brightloop Software - Authentication Service
 * 
 * Direct adapter to the confirmed FastAPI /api/v1/auth endpoints.
 */

import apiClient from './apiClient.js';
import { ROLES } from '../utils/roleHelpers.js';

/**
 * Pure client-side JWT payload decoder.
 * Used solely to inspect display role and claims.
 * Does NOT claim cryptographic verification.
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Normalizes backend role values ('admin', 'staff', 'customer') to frontend ROLES enum
 */
export function normalizeRole(role) {
  if (!role) return ROLES.CUSTOMER;
  const upper = String(role).toUpperCase();
  if (upper === 'ADMIN') return ROLES.ADMIN;
  if (upper === 'STAFF') return ROLES.STAFF;
  return ROLES.CUSTOMER;
}

export const authService = {
  /**
   * Customer Registration
   * POST /auth/register (Status 201)
   */
  async register({ email, password, full_name }) {
    return apiClient.post('/auth/register', {
      email,
      password,
      full_name
    });
  },

  /**
   * OAuth2 Password Form Login
   * POST /auth/login (Status 200)
   * Must send application/x-www-form-urlencoded with 'username' carrying the email.
   */
  async login(email, password) {
    const params = new URLSearchParams();
    params.append('username', email.trim());
    params.append('password', password);

    const data = await apiClient.post('/auth/login', params);
    return data;
  },

  /**
   * Rotate access & refresh token pair
   * POST /auth/refresh (Status 200)
   */
  async refresh(refreshToken) {
    return apiClient.post('/auth/refresh', {
      refresh_token: refreshToken
    });
  },

  /**
   * Current Authenticated User profile
   * GET /auth/me (Status 200)
   * Note: The response body contains id, email, full_name.
   * The user's role is stored inside the JWT access token.
   */
  async getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  /**
   * Stateless Logout
   * POST /auth/logout (Status 204)
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Discard server logout errors since JWT is client-discarded
    }
  },

  /**
   * Initiate Password Recovery
   * POST /auth/forgot-password (Status 202)
   */
  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', {
      email: email.trim()
    });
  },

  /**
   * Complete Password Reset with token
   * POST /auth/reset-password (Status 204)
   */
  async resetPassword(token, newPassword) {
    return apiClient.post('/auth/reset-password', {
      token: token.trim(),
      new_password: newPassword
    });
  },

  /**
   * Provision Staff Member (Admin privilege required)
   * POST /auth/staff (Status 201)
   */
  async createStaff({ email, password, full_name }) {
    return apiClient.post('/auth/staff', {
      email: email.trim(),
      password,
      full_name: full_name.trim()
    });
  }
};

export default authService;

