import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '@/constants/Colors';

type SkeletonVariant = 'rect' | 'circle' | 'text' | 'avatar' | 'card' | 'product';

type SkeletonLoaderProps = {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: number;
  style?: ViewStyle;
  lines?: number; // Pour variant 'text'
  animated?: boolean;
};

export default function SkeletonLoader({
  variant = 'rect',
  width = '100%',
  height = 20,
  style,
  lines = 3,
  animated = true,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const renderSkeleton = () => {
    switch (variant) {
      case 'circle':
        return (
          <View
            style={[
              styles.skeleton,
              {
                width: height,
                height: height,
                borderRadius: BorderRadius.full,
              },
              style,
            ]}>
            {animated && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { transform: [{ translateX }] },
                ]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
          </View>
        );

      case 'avatar':
        return (
          <View style={styles.avatarContainer}>
            <View style={[styles.skeleton, styles.avatar, style]}>
              {animated && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX }] },
                  ]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}
            </View>
            <View style={styles.avatarInfo}>
              <View style={[styles.skeleton, styles.avatarName]} />
              <View style={[styles.skeleton, styles.avatarSubtext]} />
            </View>
          </View>
        );

      case 'text':
        return (
          <View style={style}>
            {Array.from({ length: lines }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.skeleton,
                  styles.textLine,
                  {
                    width: index === lines - 1 ? '70%' : '100%',
                    marginBottom: index < lines - 1 ? Spacing.xs : 0,
                  },
                ]}>
                {animated && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      { transform: [{ translateX }] },
                    ]}>
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                )}
              </View>
            ))}
          </View>
        );

      case 'card':
        return (
          <View style={[styles.card, style]}>
            <View style={[styles.skeleton, styles.cardImage]}>
              {animated && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX }] },
                  ]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}
            </View>
            <View style={styles.cardContent}>
              <View style={[styles.skeleton, styles.cardTitle]} />
              <View style={[styles.skeleton, styles.cardSubtitle]} />
            </View>
          </View>
        );

      case 'product':
        return (
          <View style={[styles.productCard, style]}>
            <View style={[styles.skeleton, styles.productImage]}>
              {animated && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX }] },
                  ]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}
            </View>
            <View style={styles.productContent}>
              <View style={[styles.skeleton, styles.productTitle]} />
              <View style={[styles.skeleton, styles.productPrice]} />
            </View>
          </View>
        );

      case 'rect':
      default:
        return (
          <View
            style={[
              styles.skeleton,
              {
                width,
                height,
                borderRadius: BorderRadius.md,
              },
              style,
            ]}>
            {animated && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { transform: [{ translateX }] },
                ]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
          </View>
        );
    }
  };

  return renderSkeleton();
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  // Avatar variant
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
  },
  avatarInfo: {
    flex: 1,
  },
  avatarName: {
    width: '60%',
    height: 16,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  avatarSubtext: {
    width: '40%',
    height: 12,
    borderRadius: BorderRadius.sm,
  },
  // Text variant
  textLine: {
    height: 14,
    borderRadius: BorderRadius.sm,
  },
  // Card variant
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    width: '80%',
    height: 18,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  cardSubtitle: {
    width: '60%',
    height: 14,
    borderRadius: BorderRadius.sm,
  },
  // Product variant
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productContent: {
    padding: Spacing.sm + 2,
  },
  productTitle: {
    width: '90%',
    height: 16,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  productPrice: {
    width: '40%',
    height: 20,
    borderRadius: BorderRadius.sm,
  },
});
