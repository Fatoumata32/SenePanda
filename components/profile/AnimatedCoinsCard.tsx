/**
 * Composant de carte PandaCoins animée et interactive
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, TrendingUp, Gift, Star, Sparkles } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { speak } from '@/lib/voiceGuide';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedCoinsCardProps {
  coins: number;
  previousCoins?: number;
  onPress?: () => void;
  showAnimation?: boolean;
}

export default function AnimatedCoinsCard({
  coins,
  previousCoins = coins,
  onPress,
  showAnimation = true,
}: AnimatedCoinsCardProps) {
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const coinCountAnim = useRef(new Animated.Value(previousCoins)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // State
  const [isAnimating, setIsAnimating] = useState(false);
  const [coinDifference, setCoinDifference] = useState(0);

  useEffect(() => {
    // Détecter changement de coins
    if (showAnimation && coins !== previousCoins) {
      const diff = coins - previousCoins;
      setCoinDifference(diff);
      animateCoinsChange(diff);
    }
  }, [coins]);

  useEffect(() => {
    // Animation de glow continue
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animateCoinsChange = (diff: number) => {
    setIsAnimating(true);

    // Vibration
    Haptics.impactAsync(
      diff > 0
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );

    // Annonce vocale
    if (diff > 0) {
      speak(`Vous avez gagné ${diff} PandaCoins!`, { rate: 1.1, pitch: 1.1 });
    }

    // Animation de la carte
    Animated.parallel([
      // Scale bounce
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]),
      // Rotation
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Sparkles
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Compteur animé
      Animated.timing(coinCountAnim, {
        toValue: coins,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsAnimating(false);
      setCoinDifference(0);
    });
  };

  const handlePress = () => {
    // Animation au tap
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    speak(`Vous avez ${coins} PandaCoins`);
    onPress?.();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.container}>
      {/* Glow Effect */}
      <Animated.View
        style={[
          styles.glowContainer,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}>
        <LinearGradient
          colors={['#FCD34D', '#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glow}
        />
      </Animated.View>

      {/* Main Card */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }, { rotate: rotation }],
          },
        ]}>
        <LinearGradient
          colors={['#FBBF24', '#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          {/* Sparkles Animation */}
          {isAnimating && (
            <Animated.View
              style={[
                styles.sparklesContainer,
                { opacity: sparkleOpacity },
              ]}>
              <Sparkles size={24} color="#FFFFFF" style={styles.sparkle1} />
              <Sparkles size={20} color="#FEF3C7" style={styles.sparkle2} />
              <Sparkles size={18} color="#FFFFFF" style={styles.sparkle3} />
              <Sparkles size={22} color="#FEF3C7" style={styles.sparkle4} />
            </Animated.View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Coins size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>

            {/* Coins Amount */}
            <View style={styles.amountContainer}>
              <Text style={styles.label}>PandaCoins</Text>
              <Animated.Text style={styles.amount}>
                {Math.floor(coinCountAnim.__getValue()).toLocaleString()}
              </Animated.Text>

              {/* Change Indicator */}
              {isAnimating && coinDifference !== 0 && (
                <Animated.View
                  style={[
                    styles.changeIndicator,
                    {
                      backgroundColor:
                        coinDifference > 0 ? '#10B981' : '#EF4444',
                      opacity: sparkleOpacity,
                    },
                  ]}>
                  {coinDifference > 0 ? (
                    <TrendingUp size={12} color="#FFFFFF" />
                  ) : (
                    <TrendingUp
                      size={12}
                      color="#FFFFFF"
                      style={{ transform: [{ rotate: '180deg' }] }}
                    />
                  )}
                  <Text style={styles.changeText}>
                    {coinDifference > 0 ? '+' : ''}
                    {coinDifference}
                  </Text>
                </Animated.View>
              )}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                speak('Boutique de récompenses');
                // Navigate to rewards shop
              }}>
              <Gift size={20} color="#D97706" />
            </TouchableOpacity>
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />

          {/* Star Icons */}
          <Star
            size={16}
            color="#FEF3C7"
            fill="#FEF3C7"
            style={styles.starIcon1}
          />
          <Star
            size={12}
            color="#FEF3C7"
            fill="#FEF3C7"
            style={styles.starIcon2}
          />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
  },
  glowContainer: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.xl,
  },
  glow: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    opacity: 0.3,
  },
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  gradient: {
    padding: Spacing.xl,
    minHeight: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  amountContainer: {
    flex: 1,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#FEF3C7',
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 36,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  changeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sparklesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    right: 30,
  },
  sparkle2: {
    position: 'absolute',
    top: 40,
    left: 40,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 30,
    right: 50,
  },
  sparkle4: {
    position: 'absolute',
    bottom: 40,
    left: 60,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -10,
    left: -10,
  },
  starIcon1: {
    position: 'absolute',
    top: 15,
    left: 20,
    opacity: 0.6,
  },
  starIcon2: {
    position: 'absolute',
    bottom: 20,
    right: 25,
    opacity: 0.5,
  },
});
