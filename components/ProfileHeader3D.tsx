import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Camera, Crown, Sparkles } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type ProfileHeader3DProps = {
  avatarUri?: string | null;
  username: string;
  fullName: string;
  isPremium?: boolean;
  onAvatarPress?: () => void;
};

export default function ProfileHeader3D({
  avatarUri,
  username,
  fullName,
  isPremium = false,
  onAvatarPress,
}: ProfileHeader3DProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [particles] = useState(() =>
    Array.from({ length: 15 }, () => ({
      x: Math.random() * width, // Position fixe, pas animée
      y: useRef(new Animated.Value(Math.random() * 300)).current,
      opacity: useRef(new Animated.Value(Math.random())).current,
    }))
  );

  useEffect(() => {
    // Avatar floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
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

    // Subtle rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation for premium users
    if (isPremium) {
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

    // Particles animation
    particles.forEach((particle, index) => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(particle.y, {
              toValue: -50,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start(() => {
        particle.y.setValue(300);
      });
    });
  }, [isPremium]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>

        {/* Animated particles */}
        {particles.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: particle.x, // Position fixe (non animée)
                transform: [{ translateY: particle.y }],
                opacity: particle.opacity,
              },
            ]}>
            <Sparkles size={12} color="rgba(255, 255, 255, 0.6)" />
          </Animated.View>
        ))}

        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <Animated.View style={[styles.decorativeCircle3, { transform: [{ rotate }] }]} />

        {/* Avatar with 3D effect */}
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              transform: [{ translateY: floatAnim }],
            },
          ]}>

          {isPremium && (
            <Animated.View
              style={[
                styles.premiumGlow,
                {
                  opacity: glowOpacity,
                },
              ]}
            />
          )}

          <TouchableOpacity
            onPress={onAvatarPress}
            activeOpacity={0.8}
            style={styles.avatarTouchable}>
            <View style={styles.avatarWrapper}>
              <BlurView intensity={20} tint="light" style={styles.avatarBlur}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient
                    colors={['#E5E7EB', '#D1D5DB']}
                    style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {((fullName || username || '?') + '')[0]?.toUpperCase() || '?'}
                    </Text>
                  </LinearGradient>
                )}
              </BlurView>

              {/* Camera button */}
              <View style={styles.cameraButton}>
                <LinearGradient
                  colors={[Colors.primaryOrange, '#FFA500']}
                  style={styles.cameraGradient}>
                  <Camera size={18} color={Colors.white} />
                </LinearGradient>
              </View>
            </View>
          </TouchableOpacity>

          {isPremium && (
            <View style={styles.premiumBadge}>
              <LinearGradient
                colors={[Colors.primaryGold, '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumBadgeGradient}>
                <Crown size={16} color={Colors.white} fill={Colors.white} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </LinearGradient>
            </View>
          )}
        </Animated.View>

        {/* User info */}
        <View style={styles.userInfo}>
          <Text style={styles.fullName}>{fullName || 'Utilisateur'}</Text>
          <Text style={styles.username}>@{username || 'username'}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing['2xl'],
  },
  gradient: {
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.large,
  },
  particle: {
    position: 'absolute',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -30,
    left: -30,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: '50%',
    left: '10%',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    zIndex: 10,
  },
  premiumGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primaryGold,
    top: -10,
    left: '50%',
    marginLeft: -70,
  },
  avatarTouchable: {
    width: 120,
    height: 120,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  avatarBlur: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Shadows.large,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textMuted,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  cameraGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    marginTop: Spacing.sm,
  },
  premiumBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    ...Shadows.medium,
  },
  premiumBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  userInfo: {
    alignItems: 'center',
    zIndex: 5,
  },
  fullName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs - 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  username: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.fontWeight.medium,
  },
});
