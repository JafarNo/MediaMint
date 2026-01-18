// API Configuration
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // If explicitly set in environment, use that
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.endsWith('/')
      ? process.env.EXPO_PUBLIC_API_BASE_URL.slice(0, -1)
      : process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Development: Dynamic IP handling
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

  if (debuggerHost) {
    // If running on physical device, use the IP of the machine running Metro
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8000`;
  }

  // Fallback for emulator/simulator
  return `http://${localhost}:8000`;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT) || 30000,
  VIDEO_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_VIDEO_TIMEOUT) || 90000, // 90 seconds for video generation
};

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/token',
  REGISTER: '/auth/',
  REFRESH_TOKEN: '/auth/refresh',
  VERIFY_TOKEN: '/auth/verify',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // User
  USER_PROFILE: '/user/',
  UPDATE_PASSWORD: '/user/password',
  UPDATE_PHONE: '/user/phonenumber',

  // Content Generation
  TEXT_GENERATE: '/content/text/',
  TEXT_LIST: '/content/text/',
  TEXT_DELETE: '/content/text/:id',

  IMAGE_GENERATE: '/content/images',
  IMAGE_LIST: '/content/images/',
  IMAGE_DELETE: '/content/images/:id',

  VIDEO_GENERATE: '/content/videos',
  VIDEO_LIST: '/content/videos/',
  VIDEO_DELETE: '/content/videos/:id',

  VOICE_GENERATE: '/content/voices/',
  VOICE_LIST: '/content/voices/',
  VOICE_DELETE: '/content/voices/:id',

  // Enhancements
  // Removed
};
