/**
 * Shared Style Constants
 * Reusable styles across the application
 */

// Card styles
export const cardStyle = {
  backgroundColor: 'white',
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};

export const cardStyleLarge = {
  ...cardStyle,
  borderRadius: 20,
  padding: 20,
};

// Gradient colors
export const gradientColors = {
  primary: ['#0B3D2E', '#0F5132', '#145A32'],
  header: ['#0B3D2E', '#145A32', '#1a6b3c'],
};

// Theme colors
export const colors = {
  primary: '#0B3D2E',
  primaryLight: '#145A32',
  primaryLighter: '#1a6b3c',
  mint: '#A7F3D0',
  mintLight: '#E6F4F1',
  mintDark: '#B6EADA',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray800: '#1F2937',
  red50: '#FEE2E2',
  red500: '#EF4444',
  red600: '#DC2626',
  blue50: '#DBEAFE',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  amber50: '#FEF3C7',
  amber500: '#F59E0B',
  amber600: '#D97706',
  green50: '#D1FAE5',
  green500: '#10B981',
  green600: '#059669',
};

// Button styles
export const buttonPrimary = {
  backgroundColor: colors.primary,
  borderRadius: 16,
  paddingVertical: 16,
  alignItems: 'center',
  justifyContent: 'center',
};

export const buttonSecondary = {
  backgroundColor: colors.gray100,
  borderRadius: 16,
  paddingVertical: 16,
  alignItems: 'center',
  justifyContent: 'center',
};

export const buttonDanger = {
  backgroundColor: colors.red50,
  borderRadius: 16,
  paddingVertical: 16,
  alignItems: 'center',
  justifyContent: 'center',
};

// Input styles
export const inputStyle = {
  backgroundColor: colors.gray100,
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  color: colors.gray800,
};

// Modal styles
export const modalOverlay = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
};

export const modalContent = {
  backgroundColor: 'white',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingHorizontal: 24,
  paddingTop: 24,
  paddingBottom: 40,
};

// Icon container styles
export const iconContainer = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
};

export const iconContainerLarge = {
  width: 50,
  height: 50,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
};

// Shadow styles
export const shadowLight = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};

export const shadowMedium = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 4,
};

export const shadowHeavy = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8,
};
