import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

type QuickActionButton = {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  onPress: () => void;
  gradient: readonly [string, string, ...string[]];
  badge?: number;
};

type QuickActionsProps = {
  actions: QuickActionButton[];
};

export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <ActionButton key={index} {...action} delay={index * 100} />
      ))}
    </View>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onPress,
  gradient,
  badge,
  delay,
}: QuickActionButton & { delay: number }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.actionContainer,
        {
          transform: [{ scale: scaleAnim }, { scale: pressAnim }],
        },
      ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionGradient}>
          <View style={styles.iconContainer}>
            <Icon size={24} color={Colors.white} />
            {badge && badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badge > 99 ? '99+' : badge}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.actionLabel} numberOfLines={1}>
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.lg,
  },
  actionContainer: {
    width: '25%',
    padding: Spacing.xs,
  },
  actionGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.medium,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textAlign: 'center',
  },
});
