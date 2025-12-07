import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

type GradientVariant = 'goldOrange' | 'green' | 'hero' | 'subscription' | 'primary' | 'secondary';

interface GradientButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  variant?: GradientVariant;
  onPress?: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * Bouton réutilisable avec gradient
 * Remplace les 310+ instances de LinearGradient dans l'app
 *
 * @example
 * <GradientButton variant="goldOrange" onPress={handlePress}>
 *   Acheter maintenant
 * </GradientButton>
 *
 * @example
 * <GradientButton variant="green" loading={isLoading} icon={<CheckIcon />}>
 *   Valider
 * </GradientButton>
 */
export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  variant = 'goldOrange',
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  haptic = true,
  icon,
  iconPosition = 'left',
  ...touchableProps
}) => {
  const handlePress = async () => {
    if (loading || disabled || !onPress) return;

    // Haptic feedback
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Execute onPress
    await onPress();
  };

  // Get gradient configuration
  const gradientConfig = (Gradients as any)[variant] || Gradients.goldOrange;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={handlePress}
      style={[styles.container, isDisabled && styles.disabled, style]}
      {...touchableProps}
    >
      <LinearGradient
        colors={gradientConfig.colors}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}

            {typeof children === 'string' ? (
              <Text style={[styles.text, textStyle]}>{children}</Text>
            ) : (
              children
            )}

            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
