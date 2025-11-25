import React, { memo, useCallback } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  AccessibilityRole,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface AccessibleButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  disabled?: boolean;
  style?: ViewStyle;
}

function AccessibleButtonComponent({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  hapticFeedback = 'light',
  disabled = false,
  style,
  ...props
}: AccessibleButtonProps) {
  const handlePress = useCallback((event: GestureResponderEvent) => {
    if (disabled) return;

    // Provide haptic feedback
    if (hapticFeedback !== 'none') {
      switch (hapticFeedback) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    }

    onPress?.(event);
  }, [disabled, hapticFeedback, onPress]);

  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled }}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    // Default styles - can be overridden
  },
  disabled: {
    opacity: 0.5,
  },
});

export const AccessibleButton = memo(AccessibleButtonComponent);
export default AccessibleButton;
