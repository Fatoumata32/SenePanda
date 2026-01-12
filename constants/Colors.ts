/**
 * Design System Colors - SenePanda
 * Based on the design guidelines from Home_page.html
 */

export const Colors = {
  // Primary Colors (aliases for backwards compatibility)
  primary: '#FF8C00',
  secondary: '#FFD700',
  primaryGold: '#FFD700',
  primaryOrange: '#FF8C00',

  // Success Colors
  successGreen: '#32CD32',
  darkGreen: '#228B22',

  // Semantic Colors
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  success: '#10B981',

  // Neutral Colors
  black: '#000000',
  dark: '#1C1C1C',
  beige: '#f9eddd',
  lemon: '#FFFACD',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  darkGray: '#374151',

  // Text Colors
  text: '#1F2937',
  textPrimary: '#1C1C1C',
  textSecondary: '#666666',
  textMuted: '#9CA3AF',

  // Background Colors
  background: '#F9FAFB',
  backgroundLight: '#F9FAFB',
  backgroundBeige: '#f9eddd',
  backgroundLemon: '#FFFACD',

  // Gradient Colors
  gradientGoldOrange: ['#FFD700', '#FF8C00'],
  gradientGreen: ['#32CD32', '#228B22'],
  gradientHero: ['#f9eddd', '#FFFACD', '#FFFFFF'],
  gradientSubscription: ['#f9eddd', '#FFFACD', '#f9eddd'],

  // Border Colors
  border: '#E5E7EB',
  borderLight: '#e0e0e0',
  borderFocus: '#FFD700',

  // Light Colors (for backgrounds)
  lightBlue: '#DBEAFE',
  lightGreen: '#D1FAE5',
  errorLight: '#FEE2E2',

  // Shadow Colors (for React Native)
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowHeavy: 'rgba(0, 0, 0, 0.15)',
  shadowGold: 'rgba(255, 215, 0, 0.3)',
  shadowOrange: 'rgba(255, 140, 0, 0.3)',
};

export const Gradients = {
  goldOrange: {
    colors: ['#FFD700', '#FFA500', '#FF8C00'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  green: {
    colors: ['#32CD32', '#228B22'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  hero: {
    colors: ['#f9eddd', '#FFFACD', '#FFFFFF'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  subscription: {
    colors: ['#f9eddd', '#FFFACD', '#f9eddd'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export const Typography = {
  fontFamily: {
    regular: 'Segoe UI',
    // For React Native, you might want to use system fonts:
    // iOS: 'System',
    // Android: 'Roboto',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 22,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  headingSmall: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  gold: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  orange: {
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};
