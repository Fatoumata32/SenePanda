import { Text, StyleSheet, TouchableOpacity, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';
import { useRef, useEffect } from 'react';
import { getCategoryIcon, getCategoryColors } from '@/constants/CategoryIcons';

type CategoryChipProps = {
  name: string;
  icon?: string;
  isSelected?: boolean;
  onPress: () => void;
};

export default function CategoryChip({ name, icon, isSelected, onPress }: CategoryChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComponent = getCategoryIcon(name);
  const colors = getCategoryColors(name);

  useEffect(() => {
    if (isSelected) {
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        useNativeDriver: true,
        friction: 3,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
      }).start();
    }
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.05 : 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  if (isSelected) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}>
          <LinearGradient
            colors={['#FFD700', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.selectedContainer}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
              <IconComponent size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.selectedText}>{name}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}>
        <View style={styles.chipContent}>
          <View style={[styles.iconCircle, { backgroundColor: colors.bg }]}>
            <IconComponent size={18} color={colors.icon} strokeWidth={2.5} />
          </View>
          <Text style={styles.text}>{name}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    marginVertical: 4,
    marginHorizontal: 2,
  },
  selectedContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: 4,
    marginHorizontal: 2,
    ...Shadows.large,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  text: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  selectedText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
