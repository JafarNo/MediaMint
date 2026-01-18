import { API_CONFIG, ENDPOINTS } from '../constants/config';

class AuthAPI {
  async login(username, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store refresh token if provided
      if (data.refresh_token) {
        const { storage } = await import('../utils/storage');
        await storage.setRefreshToken(data.refresh_token);
      }
      
      return data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const requestBody = {
        username: userData.username,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        password: userData.password,
        role: userData.role || 'user',
        phone_number: userData.phoneNumber || '',
      };
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let responseData;
      try {
        const text = await response.text();
        responseData = isJson && text ? JSON.parse(text) : text;
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        const errorMessage = responseData?.detail || responseData || 'Registration failed';
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      return typeof responseData === 'object' ? responseData : { message: responseData };
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  }

  async getUserProfile(token) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.USER_PROFILE}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  async changePassword(token, currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.UPDATE_PASSWORD}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to change password');
      }

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
  async forgotPassword(email) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.FORGOT_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send reset email');
      }

      const data = await response.json();
      
      //In development backend returns the reset token
      //In production this would be sent via email
      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.RESET_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reset password');
      }

      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async refreshToken() {
    // Delegate to apiClient which handles token refresh centrally
    const { apiClient } = await import('./apiClient');
    const newToken = await apiClient.refreshAccessToken();
    if (!newToken) {
      throw new Error('Failed to refresh token');
    }
    return { access_token: newToken };
  }
}

export const authAPI = new AuthAPI();
