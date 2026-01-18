import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api/auth';
import { setUnauthorizedCallback } from '../utils/authEvents';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Register callback for unauthorized events (e.g., expired token that can't be refreshed)
    setUnauthorizedCallback(() => {
      logout();
    });
    
    return () => {
      setUnauthorizedCallback(null);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await storage.getAccessToken();
      const userData = await storage.getUserData();
      
      if (accessToken && userData) {
        setToken(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      
      await storage.setAccessToken(response.access_token);
      setToken(response.access_token);
      
      // Refresh token is already stored in authAPI.login
      
      const userProfile = await authAPI.getUserProfile(response.access_token);
      await storage.setUserData(userProfile);
      
      setUser(userProfile);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      setToken(response.access_token);
      return { success: true, token: response.access_token };
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
      return { success: false };
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      
      const loginResult = await login(userData.username, userData.password);
      return loginResult;
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      await storage.clearAuthData();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await storage.setUserData(updatedUser);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const token = await storage.getAccessToken();
      await authAPI.changePassword(token, currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to change password.' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUserProfile,
    changePassword,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
