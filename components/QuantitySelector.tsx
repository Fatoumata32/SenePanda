import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

function QuantitySelectorComponent({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  size = 'medium',
  disabled = false,
}: QuantitySelectorProps) {
  const handleDecrease = useCallback(() => {
    if (quantity > min && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onQuantityChange(quantity - 1);
    }
  }, [quantity, min, disabled, onQuantityChange]);

  const handleIncrease = useCallback(() => {
    if (quantity < max && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onQuantityChange(quantity + 1);
    }
  }, [quantity, max, disabled, onQuantityChange]);

  const isDecrementDisabled = quantity <= min || disabled;
  const isIncrementDisabled = quantity >= max || disabled;

  const buttonSize = size === 'small' ? 28 : size === 'large' ? 40 : 34;
  const iconSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;
  const fontSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
  const minWidth = size === 'small' ? 28 : size === 'large' ? 40 : 34;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { width: buttonSize, height: buttonSize },
          isDecrementDisabled && styles.buttonDisabled,
        ]}
        onPress={handleDecrease}
        disabled={isDecrementDisabled}
        accessible={true}
        accessibilityLabel="Diminuer la quantité"
        accessibilityRole="button"
        accessibilityState={{ disabled: isDecrementDisabled }}
      >
        <Minus
          size={iconSize}
          color={isDecrementDisabled ? Colors.textMuted : Colors.text}
        />
      </TouchableOpacity>

      <View style={[styles.quantityContainer, { minWidth }]}>
        <Text
          style={[
            styles.quantity,
            { fontSize },
            disabled && styles.quantityDisabled,
          ]}
          accessible={true}
          accessibilityLabel={`Quantité: ${quantity}`}
        >
          {quantity}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { width: buttonSize, height: buttonSize },
          isIncrementDisabled && styles.buttonDisabled,
        ]}
        onPress={handleIncrease}
        disabled={isIncrementDisabled}
        accessible={true}
        accessibilityLabel="Augmenter la quantité"
        accessibilityRole="button"
        accessibilityState={{ disabled: isIncrementDisabled }}
      >
        <Plus
          size={iconSize}
          color={isIncrementDisabled ? Colors.textMuted : Colors.text}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  quantityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  quantityDisabled: {
    color: Colors.textMuted,
  },
});

export const QuantitySelector = memo(QuantitySelectorComponent);
export default QuantitySelector;
