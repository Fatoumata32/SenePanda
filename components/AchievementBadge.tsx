import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

type AchievementBadgeProps = {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number; // 0-100
  color?: string;
  delay?: number;
};

export default function AchievementBadge({
  icon: Icon,
  title,
  description,
  unlocked,
  progress = 0,
  color = Colors.primaryGold,
  delay = 0,
}: AchievementBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (unlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [unlocked, delay]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: unlocked ? 1 : 0.5,
        },
      ]}>
      {unlocked && (
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              backgroundColor: color,
            },
          ]}
        />
      )}

      <LinearGradient
        colors={unlocked ? [color, '#FFA500'] : ['#E5E7EB', '#D1D5DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}>
        <Animated.View style={{ transform: [{ rotate: unlocked ? rotate : '0deg' }] }}>
          <Icon size={32} color={Colors.white} />
        </Animated.View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {!unlocked && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]}>
                <LinearGradient
                  colors={[color, '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
    position: 'relative',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.xl + 4,
    opacity: 0.3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs - 2,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    minWidth: 35,
  },
});
