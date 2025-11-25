import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Check,
  Crown,
  Zap,
  TrendingUp,
  Package,
  Star,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { formatPrice } from '@/lib/formatters';
import { SubscriptionPlan, SubscriptionPlanType } from '@/types/database';
import * as Haptics from 'expo-haptics';

const planIcons: Record<SubscriptionPlanType, any> = {
  free: Package,
  starter: Zap,
  pro: TrendingUp,
  premium: Crown,
};

const planColors: Record<SubscriptionPlanType, string> = {
  free: '#6B7280',
  starter: '#3B82F6',
  pro: '#8B5CF6',
  premium: '#F59E0B',
};

const planGradients: Record<SubscriptionPlanType, readonly [string, string, ...string[]]> = {
  free: ['#9CA3AF', '#6B7280'] as const,
  starter: ['#60A5FA', '#3B82F6'] as const,
  pro: ['#A78BFA', '#8B5CF6'] as const,
  premium: ['#FCD34D', '#F59E0B'] as const,
};

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  billingPeriod: 'monthly' | 'yearly';
  onSelect: (plan: SubscriptionPlan) => void;
  recommended?: boolean;
}

function PlanCardComponent({
  plan,
  isCurrentPlan,
  billingPeriod,
  onSelect,
  recommended = false,
}: PlanCardProps) {
  const IconComponent = planIcons[plan.plan_type];
  const planColor = planColors[plan.plan_type];
  const gradientColors = planGradients[plan.plan_type];

  const price = billingPeriod === 'yearly' && plan.price_yearly
    ? plan.price_yearly
    : plan.price_monthly;

  const monthlyPrice = billingPeriod === 'yearly' && plan.price_yearly
    ? Math.round(plan.price_yearly / 12)
    : plan.price_monthly;

  const savings = billingPeriod === 'yearly' && plan.price_yearly
    ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
    : 0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(plan);
  };

  const features = [
    { label: `${plan.max_products === -1 ? 'Illimité' : plan.max_products} produits`, included: true },
    { label: `${plan.max_photos_per_product} photos/produit`, included: true },
    { label: `${(plan.commission_rate * 100).toFixed(0)}% commission`, included: true },
    { label: 'Photos HD', included: plan.hd_photos },
    { label: 'Vidéos', included: plan.video_allowed },
    { label: 'Analytics avancés', included: plan.advanced_analytics },
    { label: 'Support prioritaire', included: plan.support_level === 'priority' || plan.support_level === 'dedicated' },
    { label: 'Badge vérifié', included: plan.verified_badge },
  ];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCurrentPlan && styles.currentPlan,
        recommended && styles.recommended,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={`Plan ${plan.name}, ${formatPrice(price)} par ${billingPeriod === 'yearly' ? 'an' : 'mois'}`}
      accessibilityRole="button"
    >
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Star size={12} color={Colors.white} fill={Colors.white} />
          <Text style={styles.recommendedText}>Recommandé</Text>
        </View>
      )}

      {isCurrentPlan && (
        <View style={[styles.currentBadge, { backgroundColor: planColor }]}>
          <Text style={styles.currentBadgeText}>Actuel</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={gradientColors}
          style={styles.iconContainer}
        >
          <IconComponent size={24} color={Colors.white} />
        </LinearGradient>

        <View style={styles.planInfo}>
          <Text style={styles.planName}>{plan.name}</Text>
          {plan.badge_name && (
            <Text style={[styles.badge, { color: planColor }]}>{plan.badge_name}</Text>
          )}
        </View>
      </View>

      {/* Price */}
      <View style={styles.priceContainer}>
        {plan.plan_type === 'free' ? (
          <Text style={styles.freeText}>Gratuit</Text>
        ) : (
          <>
            <Text style={styles.price}>{formatPrice(monthlyPrice)}</Text>
            <Text style={styles.period}>/mois</Text>
          </>
        )}
      </View>

      {billingPeriod === 'yearly' && savings > 0 && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>-{savings}% économisé</Text>
        </View>
      )}

      {/* Description */}
      {plan.description && (
        <Text style={styles.description} numberOfLines={2}>
          {plan.description}
        </Text>
      )}

      {/* Features */}
      <View style={styles.features}>
        {features.slice(0, 5).map((feature, index) => (
          <View key={index} style={styles.feature}>
            <Check
              size={14}
              color={feature.included ? Colors.success : Colors.textMuted}
            />
            <Text
              style={[
                styles.featureText,
                !feature.included && styles.featureDisabled,
              ]}
            >
              {feature.label}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View
        style={[
          styles.ctaButton,
          { backgroundColor: isCurrentPlan ? Colors.lightGray : planColor },
        ]}
      >
        <Text
          style={[
            styles.ctaText,
            { color: isCurrentPlan ? Colors.textSecondary : Colors.white },
          ]}
        >
          {isCurrentPlan ? 'Plan actuel' : plan.plan_type === 'free' ? 'Sélectionner' : 'Souscrire'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  currentPlan: {
    borderColor: Colors.primaryOrange,
  },
  recommended: {
    borderColor: Colors.primaryGold,
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  period: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  freeText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.success,
  },
  savingsBadge: {
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  features: {
    gap: 8,
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: Colors.text,
  },
  featureDisabled: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  ctaButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export const PlanCard = memo(PlanCardComponent);
export default PlanCard;
