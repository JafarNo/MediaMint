import { authAPI } from '../api/auth';
import { API_CONFIG } from '../constants/config';
import { emitUnauthorized } from './authEvents';
import { storage } from './storage';

/**
 * Enhanced fetch wrapper with automatic token refresh
 */
export async function authenticatedFetch(url, options = {}) {
  const token = await storage.getAccessToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If token expired (401), try to refresh
  if (response.status === 401) {
    try {
      const refreshResult = await authAPI.refreshToken();
      
      if (refreshResult.access_token) {
        // Retry the original request with new token
        headers.Authorization = `Bearer ${refreshResult.access_token}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Emit unauthorized event to trigger logout
      emitUnauthorized();
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}

/**
 * Helper to make authenticated GET requests
 */
export async function authenticatedGet(endpoint) {
  const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Request failed');
  }

  return await response.json();
}

/**
 * Helper to make authenticated POST requests
 */
export async function authenticatedPost(endpoint, data) {
  const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Request failed');
  }

  return await response.json();
}

/**
 * Helper to make authenticated PUT requests
 */
export async function authenticatedPut(endpoint, data) {
  const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Request failed');
  }

  return response.status === 204 ? null : await response.json();
}

/**
 * Helper to make authenticated DELETE requests
 */
export async function authenticatedDelete(endpoint) {
  const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Request failed');
  }

  return response.status === 204 ? null : await response.json();
}
