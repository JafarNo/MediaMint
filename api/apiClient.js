/**
 * API Client with automatic token refresh and centralized error handling
 * Handles 401 errors by refreshing the token and retrying the request
 */

import { API_CONFIG, ENDPOINTS } from '../constants/config';
import { emitUnauthorized } from '../utils/authEvents';
import { storage } from '../utils/storage';

class APIClient {
  constructor() {
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  subscribeTokenRefresh(callback) {
    this.refreshSubscribers.push(callback);
  }

  onTokenRefreshed(newToken) {
    this.refreshSubscribers.forEach(callback => callback(newToken));
    this.refreshSubscribers = [];
  }

  onTokenRefreshFailed() {
    this.refreshSubscribers.forEach(callback => callback(null));
    this.refreshSubscribers = [];
  }

  async refreshAccessToken() {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) return null;

      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        await storage.clearAuthData();
        return null;
      }

      const data = await response.json();
      if (data.access_token) {
        await storage.setAccessToken(data.access_token);
        return data.access_token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  async request(url, options = {}) {
    let token = await storage.getAccessToken();

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // Handle 401 with token refresh
      if (response.status === 401 && token) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;

          if (newToken) {
            this.onTokenRefreshed(newToken);
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, { ...options, headers });
          } else {
            // Token refresh failed, notify subscribers and trigger logout
            this.onTokenRefreshFailed();
            emitUnauthorized();
          }
        } else {
          return new Promise((resolve) => {
            this.subscribeTokenRefresh(async (newToken) => {
              if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                resolve(await fetch(url, { ...options, headers }));
              } else {
                // Token refresh failed
                resolve(response);
              }
            });
          });
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Centralized response handler - parses JSON and throws on error
  async handleResponse(response, errorPrefix = 'Request') {
    if (!response.ok) {
      let errorMessage = `${errorPrefix} failed: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Response wasn't JSON, use default message
      }
      throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  // GET with automatic response handling
  async get(url, errorPrefix) {
    const response = await this.request(url, { method: 'GET' });
    return errorPrefix ? this.handleResponse(response, errorPrefix) : response;
  }

  // POST with automatic response handling
  async post(url, body, errorPrefix) {
    const response = await this.request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return errorPrefix ? this.handleResponse(response, errorPrefix) : response;
  }

  // PUT with automatic response handling
  async put(url, body, errorPrefix) {
    const response = await this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return errorPrefix ? this.handleResponse(response, errorPrefix) : response;
  }

  // DELETE with automatic response handling
  async delete(url, errorPrefix) {
    const response = await this.request(url, { method: 'DELETE' });
    return errorPrefix ? this.handleResponse(response, errorPrefix) : response;
  }

  // Raw request (returns response object, for backward compatibility)
  async rawGet(url) {
    return this.request(url, { method: 'GET' });
  }

  async rawPost(url, body) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async rawPut(url, body) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async rawDelete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
export default apiClient;
