import React, { memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface BillingToggleProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
  savingsPercent?: number;
}

function BillingToggleComponent({
  value,
  onChange,
  savingsPercent = 17,
}: BillingToggleProps) {
  const translateX = useRef(new Animated.Value(value === 'monthly' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value === 'monthly' ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [value]);

  const handlePress = (newValue: 'monthly' | 'yearly') => {
    if (newValue !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(newValue);
    }
  };

  const indicatorTranslate = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 156], // Adjust based on container width
  });

  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [{ translateX: indicatorTranslate }],
            },
          ]}
        />

        <TouchableOpacity
          style={styles.option}
          onPress={() => handlePress('monthly')}
          accessible={true}
          accessibilityLabel="Facturation mensuelle"
          accessibilityRole="radio"
          accessibilityState={{ selected: value === 'monthly' }}
        >
          <Text
            style={[
              styles.optionText,
              value === 'monthly' && styles.optionTextSelected,
            ]}
          >
            Mensuel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => handlePress('yearly')}
          accessible={true}
          accessibilityLabel="Facturation annuelle"
          accessibilityRole="radio"
          accessibilityState={{ selected: value === 'yearly' }}
        >
          <Text
            style={[
              styles.optionText,
              value === 'yearly' && styles.optionTextSelected,
            ]}
          >
            Annuel
          </Text>
          {savingsPercent > 0 && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>-{savingsPercent}%</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    width: 148,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  option: {
    width: 148,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: Colors.text,
  },
  savingsBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
});

export const BillingToggle = memo(BillingToggleComponent);
export default BillingToggle;
