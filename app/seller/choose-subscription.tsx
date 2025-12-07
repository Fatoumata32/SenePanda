import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { SubscriptionPlan, SubscriptionPlanType } from '@/types/database';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const planIcons: Record<SubscriptionPlanType, { name: any; type: any; color: string }> = {
  free: { name: 'cube-outline', type: Ionicons, color: '#6B7280' },
  starter: { name: 'flash', type: Ionicons, color: '#3B82F6' },
  pro: { name: 'trending-up', type: Ionicons, color: '#8B5CF6' },
  premium: { name: 'crown', type: FontAwesome5, color: '#F59E0B' },
};

export default function ChooseSubscriptionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadData();

    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Récupérer l'utilisateur
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/profile');
        }
        return;
      }
      setUserId(user.id);

      // Récupérer les plans d'abonnement
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Pré-sélectionner le plan Free par défaut
      const freePlan = plansData?.find(p => p.plan_type === 'free');
      if (freePlan) {
        setSelectedPlan(freePlan);
      }
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les plans d\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedPlan || !userId) return;

    try {
      setLoading(true);

      // Si c'est le plan Free, créer l'abonnement gratuit immédiatement
      if (selectedPlan.plan_type === 'free') {
        // Mettre à jour le profil avec l'abonnement Free
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: 'free',
            subscription_expires_at: null, // Pas d'expiration pour le plan gratuit
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileError) {
          console.error('Erreur mise à jour profil:', profileError);
          throw profileError;
        }

        // Afficher un message de succès
        Alert.alert(
          '🎉 Bienvenue !',
          'Votre boutique a été créée avec succès !\n\nVous utilisez le plan GRATUIT. Vous pourrez toujours passer à un plan payant pour débloquer plus de fonctionnalités.',
          [
            {
              text: 'Commencer',
              onPress: () => router.replace('/seller/my-shop')
            }
          ]
        );
      } else {
        // Pour les plans payants, rediriger vers la page de paiement
        router.push({
          pathname: '/seller/subscription-plans',
          params: {
            selectedPlanId: selectedPlan.id,
            fromOnboarding: 'true'
          }
        });
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de continuer. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const renderFeature = (feature: string, available: boolean) => (
    <View key={feature} style={styles.featureRow}>
      <Ionicons
        name={available ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={available ? Colors.success : Colors.error}
      />
      <Text style={[styles.featureText, !available && styles.featureTextUnavailable]}>
        {feature}
      </Text>
    </View>
  );

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan?.id === plan.id;
    const Icon = planIcons[plan.plan_type].type;
    const iconName = planIcons[plan.plan_type].name;
    const iconColor = planIcons[plan.plan_type].color;
    const isRecommended = plan.plan_type === 'starter';

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          plan.plan_type === 'premium' && styles.planCardPremium,
        ]}
        onPress={() => setSelectedPlan(plan)}
        activeOpacity={0.8}
      >
        {/* Badge recommandé */}
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>⭐ Recommandé</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.planHeader}>
          <View style={[styles.planIcon, { backgroundColor: iconColor + '20' }]}>
            <Icon name={iconName} size={32} color={iconColor} />
          </View>
          <View style={styles.planTitleContainer}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
          </View>
        </View>

        {/* Prix */}
        <View style={styles.priceContainer}>
          {plan.plan_type === 'free' ? (
            <Text style={styles.priceText}>Gratuit</Text>
          ) : (
            <>
              <Text style={styles.priceAmount}>{plan.price_monthly.toLocaleString()} FCFA</Text>
              <Text style={styles.pricePeriod}>/mois</Text>
            </>
          )}
        </View>

        {/* Fonctionnalités */}
        <View style={styles.featuresContainer}>
          {renderFeature(`${plan.max_products || 'Illimité'} produits`, true)}
          {renderFeature(`${plan.max_photos_per_product || 1} image(s) par produit`, true)}
          {plan.visibility_boost > 0 && renderFeature('Mise en avant des produits', true)}
          {plan.advanced_analytics && renderFeature('Statistiques avancées', true)}
          {plan.support_level && plan.support_level !== 'basic' && renderFeature('Support prioritaire', true)}
          {plan.verified_badge && renderFeature('Badge vérifié', true)}
          {plan.video_allowed && renderFeature('Produits vidéo', true)}
        </View>

        {/* Bouton de sélection */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.selectedText}>Sélectionné</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && plans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/profile');
            }
          }}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choisir un plan</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Message de félicitations */}
        <Animated.View
          style={[
            styles.congratsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.congratsIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.congratsTitle}>🎉 Félicitations !</Text>
          <Text style={styles.congratsText}>
            Votre boutique a été créée avec succès !{'\n'}
            Il ne reste plus qu'à choisir votre plan d'abonnement.
          </Text>
        </Animated.View>

        {/* Titre et description */}
        <Animated.View
          style={[
            styles.titleSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.mainTitle}>Choisissez votre plan</Text>
          <Text style={styles.subtitle}>
            Commencez gratuitement ou profitez de fonctionnalités avancées.{'\n'}
            Vous pourrez toujours changer de plan plus tard.
          </Text>
        </Animated.View>

        {/* Plans */}
        <Animated.View
          style={[
            styles.plansContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {plans.map(plan => renderPlanCard(plan))}
        </Animated.View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Essayez sans risque</Text>
            <Text style={styles.infoText}>
              Commencez avec le plan Free et passez à un plan payant quand vous êtes prêt.
              Aucun engagement, annulation possible à tout moment.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bouton de continuation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, (!selectedPlan || loading) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedPlan || loading}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.continueText}>
                  {selectedPlan?.plan_type === 'free' ? 'Commencer gratuitement' : 'Continuer'}
                </Text>
                <Ionicons name="arrow-forward" size={24} color={Colors.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.small,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  congratsSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  congratsIcon: {
    marginBottom: Spacing.md,
  },
  congratsTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  congratsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  mainTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  plansContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    ...Shadows.medium,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: Colors.success,
    borderWidth: 3,
    ...Shadows.large,
  },
  planCardPremium: {
    borderColor: '#F59E0B',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    ...Shadows.medium,
  },
  recommendedText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  planIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  priceText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
  },
  priceAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  pricePeriod: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  featuresContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  featureTextUnavailable: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  selectedText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lightBlue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.large,
  },
  continueButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  continueText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
});
