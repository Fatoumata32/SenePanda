import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActivateShopBannerProps {
  currentPlan?: 'free' | 'starter' | 'pro' | 'premium';
  shopIsActive?: boolean;
}

export default function ActivateShopBanner({
  currentPlan = 'free',
  shopIsActive = false,
}: ActivateShopBannerProps) {
  const router = useRouter();

  // Si la boutique est déjà activée avec un plan payant, ne rien afficher
  if (shopIsActive && currentPlan !== 'free') {
    return null;
  }

  const handleActivateShop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/seller/subscription-plans');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F59E0B', '#D97706', '#B45309']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background pattern */}
        <View style={styles.patternContainer}>
          <Ionicons name="sparkles" size={40} color="rgba(255, 255, 255, 0.1)" style={styles.sparkle1} />
          <Ionicons name="sparkles" size={30} color="rgba(255, 255, 255, 0.1)" style={styles.sparkle2} />
          <FontAwesome5 name="crown" size={50} color="rgba(255, 255, 255, 0.1)" style={styles.crown} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <FontAwesome5 name="rocket" size={32} color={Colors.white} />
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {currentPlan === 'free' ? 'Boostez votre boutique !' : 'Activez votre boutique'}
            </Text>
            <Text style={styles.subtitle}>
              {currentPlan === 'free'
                ? 'Passez à un plan payant et débloquez toutes les fonctionnalités premium'
                : 'Choisissez un plan pour activer votre boutique et commencer à vendre'}
            </Text>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={styles.activateButton}
            onPress={handleActivateShop}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>
                {currentPlan === 'free' ? 'Voir les plans' : 'Activer ma boutique'}
              </Text>
              <Ionicons name="arrow-forward-circle" size={24} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
            <Text style={styles.benefitText}>Plus de produits</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
            <Text style={styles.benefitText}>Mise en avant</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
            <Text style={styles.benefitText}>Stats avancées</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
            <Text style={styles.benefitText}>Support prioritaire</Text>
          </View>
        </View>

        {/* Current plan badge */}
        <View style={styles.currentPlanBadge}>
          <Text style={styles.currentPlanText}>
            Plan actuel: {currentPlan.toUpperCase()}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  gradient: {
    padding: Spacing.lg,
    position: 'relative',
    minHeight: 200,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    right: 20,
    transform: [{ rotate: '-15deg' }],
  },
  sparkle2: {
    position: 'absolute',
    bottom: 40,
    left: 30,
    transform: [{ rotate: '25deg' }],
  },
  crown: {
    position: 'absolute',
    top: '50%',
    right: 10,
    transform: [{ rotate: '15deg' }],
    opacity: 0.1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activateButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  benefitText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  currentPlanBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  currentPlanText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
