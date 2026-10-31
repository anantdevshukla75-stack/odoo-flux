/**
 * Brightloop Software - Centralized API Client
 *
 * Talks to the FastAPI backend under `/api/v1`.
 * Handles bearer tokens, transparent refresh, and FastAPI error shapes.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const ACCESS_TOKEN_KEY = 'bl_access_token';
const REFRESH_TOKEN_KEY = 'bl_refresh_token';

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function extractErrorMessage(data, status) {
  const detail = data?.detail;

  if (typeof detail === 'string') return detail;

  // FastAPI validation errors arrive as a list of {loc, msg, type}
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => (typeof item?.msg === 'string' ? item.msg : null))
      .filter(Boolean);
    if (parts.length > 0) return parts.join('; ');
  }

  if (typeof data?.message === 'string') return data.message;

  return `Request failed with status ${status}`;
}

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem(ACCESS_TOKEN_KEY);
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    this.onUnauthorized = null;
    this.refreshPromise = null;
  }

  setTokens(tokens) {
    this.token = tokens?.access_token || null;
    this.refreshToken = tokens?.refresh_token || null;

    if (this.token) localStorage.setItem(ACCESS_TOKEN_KEY, this.token);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);

    if (this.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  hasToken() {
    return Boolean(this.token);
  }

  buildUrl(endpoint) {
    return `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  getHeaders(isForm = false) {
    const headers = {
      Accept: 'application/json'
    };

    headers['Content-Type'] = isForm
      ? 'application/x-www-form-urlencoded'
      : 'application/json';

    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    return headers;
  }

  async parseBody(response) {
    if (response.status === 204) return null;

    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) return false;

    // Collapse concurrent 401 retries into a single refresh call
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const response = await fetch(this.buildUrl('/auth/refresh'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({ refresh_token: this.refreshToken })
          });

          if (!response.ok) return false;

          const data = await this.parseBody(response);
          if (!data?.access_token) return false;

          this.setTokens(data);
          return true;
        } catch {
          return false;
        }
      })().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body,
      isForm = false,
      skipAuthRetry = false,
      responseType,
      headers,
      ...rest
    } = options;
    const url = this.buildUrl(endpoint);

    const config = {
      ...rest,
      method,
      headers: {
        ...this.getHeaders(isForm),
        ...headers
      }
    };

    if (body !== undefined && body !== null) {
      config.body = isForm ? new URLSearchParams(body).toString() : JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url, config);
    } catch (error) {
      throw new ApiError(
        'Cannot reach the API server. Is the backend running?',
        0,
        error?.message
      );
    }

    if (response.status === 401 && !skipAuthRetry) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request(endpoint, { ...options, skipAuthRetry: true });
      }

      this.clearTokens();
      if (typeof this.onUnauthorized === 'function') this.onUnauthorized();
    }

    if (!response.ok) {
      const data = await this.parseBody(response);
      throw new ApiError(extractErrorMessage(data, response.status), response.status, data?.detail);
    }

    if (responseType === 'blob') return response.blob();

    const data = await this.parseBody(response);
    return data;
  }

  get(endpoint, params) {
    let url = endpoint;

    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value);
        }
      });
      const serialized = query.toString();
      if (serialized) url += `?${serialized}`;
    }

    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  postForm(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body, isForm: true });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  getBlob(endpoint) {
    return this.request(endpoint, { method: 'GET', responseType: 'blob' });
  }
}

export { API_BASE_URL, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
