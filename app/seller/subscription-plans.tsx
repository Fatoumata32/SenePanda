import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SubscriptionPlan, SubscriptionPlanType, Profile } from '@/types/database';
import {
  Check,
  Crown,
  Zap,
  TrendingUp,
  Package,
  Camera,
  Video,
  Eye,
  Headphones,
  BarChart3,
  Sparkles,
  Target,
  ChevronRight,
} from 'lucide-react-native';

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

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlanType>('free');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get user
      const { data: { user: userData } } = await supabase.auth.getUser();
      if (!userData) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        router.back();
        return;
      }
      setUser(userData);

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setCurrentPlan(profileData.subscription_plan || 'free');

      // Get available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user || !profile) return;

    // Si plan gratuit, juste confirmer
    if (plan.plan_type === 'free') {
      Alert.alert('Info', 'Vous êtes déjà sur le plan gratuit');
      return;
    }

    // Si déjà sur ce plan
    if (currentPlan === plan.plan_type) {
      Alert.alert('Info', 'Vous êtes déjà abonné à ce plan');
      return;
    }

    Alert.alert(
      'Confirmer l\'abonnement',
      `Vous allez souscrire au plan ${plan.name} pour ${plan.price_monthly.toLocaleString()} ${plan.currency}/mois.\n\nAvantages :\n- Commission réduite à ${plan.commission_rate}%\n- Jusqu'à ${plan.max_products} produits\n- Boost de visibilité +${plan.visibility_boost}%${plan.badge_name ? '\n- Badge "' + plan.badge_name + '"' : ''}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => confirmSubscription(plan),
        },
      ]
    );
  };

  const confirmSubscription = async (plan: SubscriptionPlan) => {
    try {
      setSubscribing(true);

      // Simuler un paiement (à remplacer par une vraie intégration de paiement)
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Appeler la fonction PostgreSQL pour mettre à jour le plan
      const { error } = await supabase.rpc('upgrade_seller_plan', {
        seller_uuid: user.id,
        new_plan: plan.plan_type,
        payment_amount: plan.price_monthly,
        payment_transaction_id: transactionId,
      });

      if (error) throw error;

      Alert.alert(
        'Félicitations !',
        `Vous êtes maintenant abonné au plan ${plan.name}. Profitez de tous vos nouveaux avantages !`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/seller/benefits');
            },
          },
        ]
      );

      // Recharger les données
      await loadData();
    } catch (error: any) {
      console.error('Error subscribing:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de souscrire à ce plan'
      );
    } finally {
      setSubscribing(false);
    }
  };

  const renderFeature = (icon: any, text: string, included: boolean = true) => {
    const Icon = icon;
    return (
      <View style={styles.featureRow}>
        {included ? (
          <Check size={16} color="#10B981" strokeWidth={3} />
        ) : (
          <View style={styles.featureNotIncluded} />
        )}
        <Icon size={16} color={included ? '#6B7280' : '#D1D5DB'} />
        <Text style={[styles.featureText, !included && styles.featureTextDisabled]}>
          {text}
        </Text>
      </View>
    );
  };

  const renderPlanCard = (plan: SubscriptionPlan, index: number) => {
    const Icon = planIcons[plan.plan_type];
    const color = planColors[plan.plan_type];
    const isCurrentPlan = currentPlan === plan.plan_type;
    const isPopular = plan.plan_type === 'pro';

    return (
      <View key={plan.id} style={styles.planCardWrapper}>
        {isPopular && (
          <View style={styles.popularBadge}>
            <Sparkles size={14} color="#FFFFFF" />
            <Text style={styles.popularText}>POPULAIRE</Text>
          </View>
        )}
        <View
          style={[
            styles.planCard,
            isCurrentPlan && styles.planCardActive,
            { borderColor: color },
          ]}>
          {/* Header */}
          <View style={styles.planHeader}>
            <View style={[styles.planIconContainer, { backgroundColor: color + '20' }]}>
              <Icon size={32} color={color} />
            </View>
            <View style={styles.planHeaderText}>
              <Text style={[styles.planName, { color }]}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            {plan.price_monthly === 0 ? (
              <Text style={styles.priceFree}>Gratuit</Text>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>
                  {plan.price_monthly.toLocaleString()}
                </Text>
                <View>
                  <Text style={styles.priceCurrency}>{plan.currency}</Text>
                  <Text style={styles.pricePeriod}>/mois</Text>
                </View>
              </View>
            )}
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {renderFeature(
              Target,
              `Commission ${plan.commission_rate}%`
            )}
            {renderFeature(
              Package,
              plan.max_products >= 999999
                ? 'Produits illimités'
                : `${plan.max_products} produits max`
            )}
            {renderFeature(
              Eye,
              plan.visibility_boost > 0
                ? `Visibilité +${plan.visibility_boost}%`
                : 'Visibilité standard'
            )}
            {renderFeature(
              Camera,
              plan.hd_photos ? 'Photos HD' : 'Photos standard',
              plan.hd_photos
            )}
            {renderFeature(
              Video,
              plan.video_allowed ? 'Vidéos autorisées' : 'Pas de vidéos',
              plan.video_allowed
            )}
            {plan.badge_name &&
              renderFeature(Check, `Badge "${plan.badge_name}"`)}
            {renderFeature(
              Headphones,
              plan.support_level === 'concierge'
                ? 'Concierge 24/7'
                : plan.support_level === 'vip'
                ? 'Support VIP'
                : plan.support_level === 'priority'
                ? 'Support prioritaire'
                : 'Support standard',
              plan.support_level !== 'standard'
            )}
            {renderFeature(
              BarChart3,
              'Statistiques avancées',
              plan.advanced_analytics
            )}
            {renderFeature(
              Sparkles,
              'Analytics IA',
              plan.ai_analytics
            )}
            {renderFeature(
              TrendingUp,
              'Campagnes sponsorisées',
              plan.sponsored_campaigns
            )}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              { backgroundColor: color },
              isCurrentPlan && styles.subscribeButtonCurrent,
              subscribing && styles.subscribeButtonDisabled,
            ]}
            onPress={() => handleSubscribe(plan)}
            disabled={subscribing || isCurrentPlan}>
            {subscribing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>
                  {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
                </Text>
                {!isCurrentPlan && <ChevronRight size={20} color="#FFFFFF" />}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Chargement des plans...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Plans d'Abonnement</Text>
          <Text style={styles.subtitle}>
            Choisissez le plan qui correspond à vos besoins
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Sparkles size={24} color="#F59E0B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Maximisez votre visibilité</Text>
            <Text style={styles.infoText}>
              Chaque plan offre des avantages progressifs pour mettre en valeur
              vos produits et augmenter vos ventes.
            </Text>
          </View>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => renderPlanCard(plan, index))}
        </View>

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Tous les plans incluent un accès complet à la plateforme et à ses
            fonctionnalités de base. Vous pouvez changer ou annuler votre plan à
            tout moment.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  planCardWrapper: {
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardActive: {
    borderWidth: 3,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  planIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  priceContainer: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  priceFree: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureNotIncluded: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  featureTextDisabled: {
    color: '#9CA3AF',
  },
  subscribeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  subscribeButtonCurrent: {
    backgroundColor: '#10B981',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerInfo: {
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
});
