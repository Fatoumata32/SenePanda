import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';
import AnimatedCounter from './AnimatedCounter';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

type StatsCardProps = {
  icon: React.ComponentType<{ size: number; color: string }>;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  color?: string;
  delay?: number;
  gradient?: readonly [string, string, ...string[]];
};

export default function StatsCard({
  icon: Icon,
  value,
  label,
  suffix = '',
  prefix = '',
  color = Colors.primaryOrange,
  delay = 0,
  gradient,
}: StatsCardProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [delay]);

  const defaultGradient = [color, '#FFA500'] as const;
  const cardGradient = gradient || defaultGradient;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
        },
      ]}>
      <LinearGradient
        colors={cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <View style={styles.iconContainer}>
          <Icon size={28} color={Colors.white} />
        </View>

        <View style={styles.content}>
          <AnimatedCounter
            end={value}
            duration={1500}
            suffix={suffix}
            prefix={prefix}
            style={styles.value}
          />
          <Text style={styles.label}>{label}</Text>
        </View>

        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 150,
    margin: Spacing.xs,
  },
  gradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.large,
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  content: {
    zIndex: 1,
  },
  value: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.fontWeight.medium,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -20,
    left: -20,
  },
});
