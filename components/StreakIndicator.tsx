import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Zap } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

type StreakIndicatorProps = {
  currentStreak: number;
  bestStreak: number;
};

export default function StreakIndicator({
  currentStreak,
  bestStreak,
}: StreakIndicatorProps) {
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flameScale, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(flameScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(flameRotate, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(flameRotate, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const rotate = flameRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#FF8E53', '#FFAD71']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        {/* Current Streak */}
        <View style={styles.streakSection}>
          <Animated.View
            style={[
              styles.flameContainer,
              {
                transform: [{ scale: flameScale }, { rotate }],
              },
            ]}>
            <Flame size={40} color={Colors.white} fill={Colors.white} />
          </Animated.View>

          <View style={styles.streakInfo}>
            <Text style={styles.streakValue}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>jours d'affilée</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Best Streak */}
        <View style={styles.bestStreakSection}>
          <Zap size={20} color="rgba(255, 255, 255, 0.9)" fill="rgba(255, 255, 255, 0.9)" />
          <Text style={styles.bestStreakText}>
            Record: <Text style={styles.bestStreakValue}>{bestStreak}</Text> jours
          </Text>
        </View>

        {/* Decorative elements */}
        <View style={styles.sparkle1}>✨</View>
        <View style={styles.sparkle2}>⭐</View>
        <View style={styles.sparkle3}>🔥</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.lg,
  },
  gradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.large,
    position: 'relative',
    overflow: 'hidden',
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  flameContainer: {
    marginRight: Spacing.lg,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    lineHeight: 48,
  },
  streakLabel: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: Spacing.md,
  },
  bestStreakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bestStreakText: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.fontWeight.medium,
  },
  bestStreakValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  sparkle1: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    fontSize: 20,
  },
  sparkle2: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    right: Spacing['3xl'],
    fontSize: 16,
  },
  sparkle3: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.xl,
    fontSize: 14,
  },
});
