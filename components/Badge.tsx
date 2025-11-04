import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'new' | 'premium';
type BadgeSize = 'small' | 'medium' | 'large';

type BadgeProps = {
  label?: string;
  count?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: ViewStyle;
};

export default function Badge({
  label,
  count,
  variant = 'primary',
  size = 'medium',
  dot = false,
  style,
}: BadgeProps) {
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#10B981', text: Colors.white };
      case 'danger':
        return { bg: '#EF4444', text: Colors.white };
      case 'warning':
        return { bg: '#F59E0B', text: Colors.white };
      case 'info':
        return { bg: '#3B82F6', text: Colors.white };
      case 'new':
        return { bg: '#8B5CF6', text: Colors.white };
      case 'premium':
        return { bg: Colors.primaryGold, text: Colors.textPrimary };
      case 'primary':
      default:
        return { bg: Colors.primaryOrange, text: Colors.white };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: {
            minWidth: 16,
            height: 16,
            paddingHorizontal: Spacing.xs - 2,
            borderRadius: BorderRadius.md,
          },
          text: {
            fontSize: 9,
            fontWeight: Typography.fontWeight.bold,
          },
        };
      case 'large':
        return {
          container: {
            minWidth: 28,
            height: 28,
            paddingHorizontal: Spacing.sm,
            borderRadius: BorderRadius.lg,
          },
          text: {
            fontSize: Typography.fontSize.sm,
            fontWeight: Typography.fontWeight.bold,
          },
        };
      case 'medium':
      default:
        return {
          container: {
            minWidth: 20,
            height: 20,
            paddingHorizontal: Spacing.xs,
            borderRadius: BorderRadius.md + 2,
          },
          text: {
            fontSize: 11,
            fontWeight: Typography.fontWeight.bold,
          },
        };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            backgroundColor: colors.bg,
            width: size === 'small' ? 8 : size === 'large' ? 14 : 10,
            height: size === 'small' ? 8 : size === 'large' ? 14 : 10,
          },
          style,
        ]}
      />
    );
  }

  const displayText = label || (count !== undefined ? (count > 99 ? '99+' : count.toString()) : '');

  if (!displayText) return null;

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: colors.bg },
        style,
      ]}>
      <Text
        style={[
          styles.text,
          sizeStyles.text,
          { color: colors.text },
        ]}
        numberOfLines={1}>
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  dot: {
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.white,
  },
});
