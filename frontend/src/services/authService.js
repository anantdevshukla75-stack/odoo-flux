/**
 * Brightloop Software - Authentication service
 *
 * Wraps the FastAPI auth endpoints and normalizes the backend user shape
 * into the camelCase / uppercase-role shape the UI expects.
 */

import apiClient from './apiClient.js';

export const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    label: 'Continue as Admin',
    description: 'Full business & catalog management',
    email: 'admin@odooflux.local',
    password: 'Password123!'
  },
  {
    role: 'STAFF',
    label: 'Continue as Staff',
    description: 'Customers, subscriptions & billing',
    email: 'staff@odooflux.local',
    password: 'Password123!'
  },
  {
    role: 'CUSTOMER',
    label: 'Continue as Customer',
    description: 'Self-service subscriptions & invoices',
    email: 'customer@odooflux.local',
    password: 'Password123!'
  }
];

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeTokenPayload(token) {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

export function normalizeUser(user, role) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name || user.fullName || '',
    role: (role || user.role || 'customer').toUpperCase(),
    isActive: user.is_active !== false
  };
}

async function fetchCurrentUser(accessToken) {
  const me = await apiClient.get('/auth/me');
  const payload = decodeTokenPayload(accessToken || apiClient.token);
  return normalizeUser(me, payload?.role);
}

export async function login(email, password) {
  const tokens = await apiClient.postForm('/auth/login', {
    username: email,
    password
  });

  apiClient.setTokens(tokens);

  try {
    const user = await fetchCurrentUser(tokens.access_token);
    return user;
  } catch (error) {
    apiClient.clearTokens();
    throw error;
  }
}

export async function register({ fullName, email, password, companyName, phone, taxId }) {
  await apiClient.post('/auth/register', {
    email,
    password,
    full_name: fullName
  });

  const user = await login(email, password);

  const profilePatch = {
    company_name: companyName || null,
    phone: phone || null,
    tax_number: taxId || null
  };

  const hasProfileData = Object.values(profilePatch).some((value) => value);
  if (hasProfileData) {
    try {
      const customer = await apiClient.get('/customers/me');
      await apiClient.patch(`/customers/${customer.id}`, profilePatch);
    } catch {
      // Registration succeeded; profile enrichment is best-effort.
    }
  }

  return user;
}

export async function restoreSession() {
  if (!apiClient.hasToken()) return null;

  try {
    return await fetchCurrentUser();
  } catch {
    apiClient.clearTokens();
    return null;
  }
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // The endpoint is a no-op; local cleanup matters more.
  } finally {
    apiClient.clearTokens();
  }
}

export async function requestPasswordReset(email) {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token, newPassword) {
  await apiClient.post('/auth/reset-password', {
    token,
    new_password: newPassword
  });
}

// Object-style compatibility for the shared API-backed staff and recovery
// screens already present on main.
export const authService = {
  async createStaff({ full_name, email, password }) {
    return apiClient.post('/auth/staff', {
      full_name: full_name.trim(),
      email: email.trim(),
      password
    });
  },
  forgotPassword: requestPasswordReset,
  resetPassword
};

export default authService;
