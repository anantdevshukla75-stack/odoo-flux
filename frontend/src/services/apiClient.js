/**
 * Brightloop Software - Centralized Enterprise API Client
 * 
 * Supports:
 * - Configurable base URL with fallback to backend port 8000
 * - In-memory access token storage
 * - SessionStorage refresh token persistence
 * - URL-encoded form data (required for /auth/login)
 * - JSON request/response handling
 * - Clean HTTP 204 No Content handling without JSON parsing
 * - Blob / binary stream response handling
 * - FastAPI 422 validation error message unpacking
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.accessToken = null;
  }

  // Access Token management (in-memory)
  setToken(token) {
    this.accessToken = token;
  }

  getToken() {
    return this.accessToken;
  }

  clearToken() {
    this.accessToken = null;
  }

  // Refresh Token management (sessionStorage)
  getRefreshToken() {
    try {
      return sessionStorage.getItem('bl_refresh_token');
    } catch {
      return null;
    }
  }

  setRefreshToken(token) {
    try {
      if (token) {
        sessionStorage.setItem('bl_refresh_token', token);
      } else {
        sessionStorage.removeItem('bl_refresh_token');
      }
    } catch {
      // Ignore sessionStorage exceptions in restricted sandboxes
    }
  }

  clearRefreshToken() {
    try {
      sessionStorage.removeItem('bl_refresh_token');
    } catch {
      // Ignore
    }
  }

  clearAllTokens() {
    this.clearToken();
    this.clearRefreshToken();
  }

  /**
   * Core request dispatcher
   */
  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers = {
      Accept: 'application/json',
      ...options.headers
    };

    if (this.accessToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let body = options.body;

    // Handle body serialization
    if (body instanceof URLSearchParams) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = body.toString();
    } else if (
      body !== null &&
      typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof Blob)
    ) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const fetchConfig = {
      ...options,
      headers,
      body
    };

    let response;
    try {
      response = await fetch(url, fetchConfig);
    } catch (networkError) {
      const err = new Error(
        `Network connection failed. Unable to reach backend server at ${this.baseUrl}.`
      );
      err.status = 0;
      err.originalError = networkError;
      throw err;
    }

    // HTTP 204 No Content must not call response.json()
    if (response.status === 204) {
      return null;
    }

    // Handle Blob/binary responses
    if (options.responseType === 'blob') {
      if (!response.ok) {
        throw new Error(`File download failed with status ${response.status}`);
      }
      return response.blob();
    }

    // Parse JSON or text response
    let responseData = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      try {
        responseData = await response.text();
      } catch {
        responseData = null;
      }
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;

      if (responseData && typeof responseData === 'object') {
        if (typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        } else if (Array.isArray(responseData.detail)) {
          // FastAPI 422 Validation Error structure: [{ loc: [...], msg: "...", type: "..." }]
          errorMessage = responseData.detail
            .map((item) => {
              const field = Array.isArray(item.loc)
                ? item.loc.filter((p) => p !== 'body').join('.')
                : '';
              return field ? `${field}: ${item.msg}` : item.msg;
            })
            .join('; ');
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } else if (typeof responseData === 'string' && responseData.trim()) {
        errorMessage = responseData;
      }

      const apiError = new Error(errorMessage);
      apiError.status = response.status;
      apiError.data = responseData;
      throw apiError;
    }

    return responseData;
  }

  get(endpoint, params = null, options = {}) {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request(url, { ...options, method: 'GET' });
  }

  post(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body
    });
  }

  patch(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
