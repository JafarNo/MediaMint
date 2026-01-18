// Theme Constants - Centralized styling values
// This file consolidates all colors, spacing, shadows, and typography

export const COLORS = {
  // Primary Brand Colors
  primary: {
    dark: '#0B3D2E',
    main: '#145A32',
    light: '#1a6b3c',
    lighter: '#235247',
    mint: '#A7F3D0',
    mintLight: '#E0FAFA',
    mintPale: '#ECFDF5',
  },

  // Background Colors
  background: {
    primary: '#F9FAFB',
    secondary: '#F5F5F5',
    white: '#FFFFFF',
    dark: '#0B3D2E',
  },

  // Text Colors
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
    tertiary: '#6B7280',
    muted: '#9CA3AF',
    light: '#D1D5DB',
    white: '#FFFFFF',
    mintLight: '#E8FFF3',
    mintMuted: '#B6EADA',
    mintPale: '#CFFFE5',
    mintInput: '#A7E6CF',
  },

  // Status Colors
  status: {
    success: '#10B981',
    successLight: '#D1FAE5',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    warningDark: '#D97706',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#EFF6FF',
    infoDark: '#2563EB',
  },

  // Platform Colors
  platform: {
    instagram: '#E1306C',
    instagramBg: '#FFEEF2',
    facebook: '#1877F2',
    facebookBg: '#E7F3FF',
    tiktok: '#000000',
    tiktokBg: '#F0F0F0',
    twitter: '#000000',
    twitterBg: '#F5F5F5',
    linkedin: '#0A66C2',
    linkedinBg: '#E8F4FC',
  },

  // UI Colors
  ui: {
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    divider: '#F3F4F6',
    overlay: 'rgba(0,0,0,0.5)',
    cardShadow: '#000',
    disabled: '#F3F4F6',
    disabledText: '#9CA3AF',
  },

  // Gradient Arrays
  gradients: {
    primary: ['#0B3D2E', '#0F5132', '#145A32'],
    header: ['#0B3D2E', '#145A32', '#1a6b3c'],
    headerSimple: ['#0B3D2E', '#145A32'],
    button: ['#0B3D2E', '#145A32'],
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 9999,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 16,
  xxl: 18,
  xxxl: 24,
  title: 24,
};

export const FONT_WEIGHTS = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 20,
  xl: 22,
  xxl: 24,
  xxxl: 28,
  huge: 32,
  giant: 64,
};

// Common component dimensions
export const DIMENSIONS = {
  headerIconButton: 44,
  avatarSmall: 36,
  avatarMedium: 44,
  avatarLarge: 56,
  inputHeight: 60,
  buttonHeight: 56,
  tabBarHeight: 80,
  cardIconSmall: 24,
  cardIconMedium: 36,
  cardIconLarge: 48,
};

// Activity type icon mappings
export const ACTIVITY_ICONS = {
  content_generated: { icon: 'sparkles', color: COLORS.status.success, bg: COLORS.status.successLight },
  post_created: { icon: 'checkmark-circle', color: COLORS.status.success, bg: COLORS.status.successLight },
  post_scheduled: { icon: 'calendar', color: COLORS.status.warning, bg: COLORS.status.warningLight },
  response_generated: { icon: 'chatbubbles', color: '#8B5CF6', bg: '#F3E8FF' },
  default: { icon: 'information-circle', color: COLORS.text.tertiary, bg: COLORS.ui.borderLight },
};

// Platform icon mappings
export const PLATFORM_ICONS = {
  instagram: { 
    icon: 'logo-instagram', 
    color: COLORS.platform.instagram, 
    bg: COLORS.platform.instagramBg,
    name: 'Instagram',
  },
  facebook: { 
    icon: 'logo-facebook', 
    color: COLORS.platform.facebook, 
    bg: COLORS.platform.facebookBg,
    name: 'Facebook',
  },
  tiktok: { 
    icon: 'logo-tiktok', 
    color: COLORS.platform.tiktok, 
    bg: COLORS.platform.tiktokBg,
    name: 'TikTok',
  },
  twitter: { 
    icon: 'logo-twitter', 
    color: COLORS.platform.twitter, 
    bg: COLORS.platform.twitterBg,
    name: 'Twitter',
  },
  linkedin: { 
    icon: 'logo-linkedin', 
    color: COLORS.platform.linkedin, 
    bg: COLORS.platform.linkedinBg,
    name: 'LinkedIn',
  },
  default: { 
    icon: 'globe', 
    color: COLORS.text.tertiary, 
    bg: COLORS.ui.borderLight,
    name: 'Other',
  },
};

// Status styling
export const STATUS_STYLES = {
  published: {
    bg: COLORS.status.successLight,
    text: COLORS.status.successDark,
    icon: 'checkmark-circle',
  },
  scheduled: {
    bg: COLORS.status.infoLight,
    text: COLORS.status.infoDark,
    icon: 'time',
  },
  draft: {
    bg: COLORS.status.warningLight,
    text: COLORS.status.warningDark,
    icon: 'document-text',
  },
  failed: {
    bg: COLORS.status.errorLight,
    text: COLORS.status.error,
    icon: 'close-circle',
  },
};

export default {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  ICON_SIZES,
  DIMENSIONS,
  ACTIVITY_ICONS,
  PLATFORM_ICONS,
  STATUS_STYLES,
};
