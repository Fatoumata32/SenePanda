import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

/**
 * Hook pour obtenir les couleurs du thème actuel
 * Remplace la duplication de themeColors dans 3+ fichiers
 *
 * @example
 * const colors = useThemeColors();
 * <View style={{ backgroundColor: colors.background }}>
 *   <Text style={{ color: colors.text }}>Hello</Text>
 * </View>
 */
export const useThemeColors = () => {
  const { isDark } = useTheme();

  return useMemo(
    () => ({
      // Backgrounds
      background: isDark ? '#111827' : Colors.white,
      backgroundLight: isDark ? '#1F2937' : Colors.backgroundLight,
      card: isDark ? '#1F2937' : Colors.white,
      cardHover: isDark ? '#374151' : '#F9FAFB',

      // Text
      text: isDark ? '#F9FAFB' : Colors.dark,
      textSecondary: isDark ? '#D1D5DB' : Colors.textSecondary,
      textMuted: isDark ? '#9CA3AF' : Colors.textMuted,
      textInverse: isDark ? Colors.dark : Colors.white,

      // Borders
      border: isDark ? '#374151' : '#E5E7EB',
      borderLight: isDark ? '#4B5563' : Colors.borderLight,
      borderFocus: isDark ? '#FFD700' : Colors.borderFocus,

      // Interactive elements
      searchBg: isDark ? '#374151' : Colors.backgroundLight,
      inputBg: isDark ? '#1F2937' : Colors.white,
      buttonBg: isDark ? '#374151' : Colors.white,

      // Status colors (don't change with theme)
      primary: Colors.primaryOrange,
      primaryGold: Colors.primaryGold,
      success: Colors.successGreen,
      error: Colors.error,
      warning: Colors.warning,
      info: Colors.info,

      // Shadows (adjusted for dark mode)
      shadow: isDark ? 'rgba(0, 0, 0, 0.5)' : Colors.shadowMedium,
      shadowLight: isDark ? 'rgba(0, 0, 0, 0.3)' : Colors.shadowLight,
      shadowHeavy: isDark ? 'rgba(0, 0, 0, 0.7)' : Colors.shadowHeavy,
    }),
    [isDark]
  );
};

/**
 * Type helper for theme colors
 */
export type ThemeColors = ReturnType<typeof useThemeColors>;
