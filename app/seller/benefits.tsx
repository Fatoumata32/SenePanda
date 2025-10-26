import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Profile, SubscriptionPlanType } from '@/types/database';
import {
  Award,
  TrendingUp,
  Zap,
  Shield,
  Star,
  Package,
  DollarSign,
  Eye,
  Crown,
  ChevronRight,
  Target,
  TrendingDown,
  Clock,
  Sparkles,
  ArrowUpCircle,
  CheckCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Configuration des plans d'abonnement
const subscriptionPlans: Record<SubscriptionPlanType, {
  name: string;
  icon: any;
  color: string;
  emoji: string;
  commission: number;
  maxProducts: number;
  visibilityBoost: number;
  price: number;
}> = {
  free: {
    name: 'Gratuit',
    icon: Package,
    color: '#6B7280',
    emoji: '📦',
    commission: 20,
    maxProducts: 5,
    visibilityBoost: 0,
    price: 0,
  },
  starter: {
    name: 'Starter',
    icon: Zap,
    color: '#3B82F6',
    emoji: '⚡',
    commission: 15,
    maxProducts: 25,
    visibilityBoost: 20,
    price: 5000,
  },
  pro: {
    name: 'Pro',
    icon: TrendingUp,
    color: '#8B5CF6',
    emoji: '🚀',
    commission: 10,
    maxProducts: 100,
    visibilityBoost: 50,
    price: 15000,
  },
  premium: {
    name: 'Premium',
    icon: Crown,
    color: '#F59E0B',
    emoji: '👑',
    commission: 7,
    maxProducts: 999999,
    visibilityBoost: 100,
    price: 30000,
  },
};

export default function SellerBenefitsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    activeProducts: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadData();
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadData();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      if (!user?.id) return;
      if (!refreshing) setLoading(true);

      // Fetch profile avec plan d'abonnement
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch statistiques de ventes
      const { data: productsData } = await supabase
        .from('products')
        .select('id, is_active')
        .eq('seller_id', user.id);

      const productIds = productsData?.map(p => p.id) || [];
      const activeProducts = productsData?.filter(p => p.is_active).length || 0;

      // Obtenir les commandes avec montants
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, unit_price')
        .in('product_id', productIds);

      const orderIds = [...new Set(orderItemsData?.map(oi => oi.order_id) || [])];

      // Commandes livrées
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .in('id', orderIds)
        .eq('status', 'delivered');

      const totalSales = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Revenus du dernier mois
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const monthlyRevenue = ordersData?.filter(order =>
        new Date(order.created_at) >= oneMonthAgo
      ).reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      setStats({
        totalSales,
        totalRevenue,
        averageOrderValue,
        activeProducts,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error loading seller data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculer les économies/gains avec chaque plan
  const calculateROI = (planType: SubscriptionPlanType) => {
    const plan = subscriptionPlans[planType];
    const currentPlan = subscriptionPlans[((profile as any)?.subscription_plan || 'free') as SubscriptionPlanType];

    // Économie sur commission
    const commissionSaved = (currentPlan.commission - plan.commission) / 100 * stats.monthlyRevenue;

    // Coût du plan
    const planCost = plan.price;

    // Bénéfice net mensuel
    const monthlyProfit = commissionSaved - planCost;

    // Estimation de l'augmentation des ventes grâce à la visibilité
    const visibilityIncrease = plan.visibilityBoost / 100;
    const estimatedExtraSales = stats.monthlyRevenue * visibilityIncrease;
    const estimatedExtraProfit = estimatedExtraSales * (1 - plan.commission / 100);

    // ROI total
    const totalMonthlyBenefit = monthlyProfit + estimatedExtraProfit;

    return {
      commissionSaved,
      planCost,
      monthlyProfit,
      estimatedExtraSales,
      estimatedExtraProfit,
      totalMonthlyBenefit,
      breakEvenSales: planCost / (currentPlan.commission - plan.commission) * 100,
      roi: planCost > 0 ? (totalMonthlyBenefit / planCost * 100) : 0,
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!user || !profile?.is_seller) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Award size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            Cette page est réservée aux vendeurs
          </Text>
          <TouchableOpacity
            style={styles.becomeSellerButton}
            onPress={() => router.push('/profile')}>
            <Text style={styles.becomeSellerButtonText}>Devenir vendeur</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentPlan = (profile as any).subscription_plan || 'free';
  const currentPlanData = subscriptionPlans[currentPlan as SubscriptionPlanType];
  const Icon = currentPlanData.icon;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* Header avec Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: currentPlanData.color + '15' }]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>{currentPlanData.emoji}</Text>
            <Text style={styles.heroTitle}>Plan {currentPlanData.name}</Text>
            <Text style={styles.heroSubtitle}>
              {currentPlan === 'free'
                ? 'Vous économisez déjà avec notre plateforme !'
                : 'Vous profitez d\'avantages exclusifs'}
            </Text>
          </View>
        </View>

        {/* Statistiques de Performance - ULTRA VISIBLES */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Vos Performances</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
                <DollarSign size={24} color="#10B981" />
              </View>
              <Text style={styles.statValue}>
                {stats.monthlyRevenue.toLocaleString()} XOF
              </Text>
              <Text style={styles.statLabel}>Revenus ce mois</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
                <Package size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{stats.totalSales}</Text>
              <Text style={styles.statLabel}>Ventes totales</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3B82F615' }]}>
                <Target size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>
                {stats.averageOrderValue.toLocaleString()} XOF
              </Text>
              <Text style={styles.statLabel}>Panier moyen</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
                <Eye size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{stats.activeProducts}</Text>
              <Text style={styles.statLabel}>Produits actifs</Text>
            </View>
          </View>
        </View>

        {/* CALCUL ROI EN TEMPS RÉEL - SECTION CHOC */}
        <View style={styles.roiSection}>
          <View style={styles.roiHeader}>
            <Sparkles size={24} color="#F59E0B" />
            <Text style={styles.roiTitle}>💰 Combien vous gagnez/perdez ?</Text>
          </View>

          {/* Commission actuelle */}
          <View style={[styles.currentCommissionCard, { borderColor: currentPlanData.color }]}>
            <View style={styles.commissionHeader}>
              <Text style={styles.commissionTitle}>Commission actuelle</Text>
              <Text style={[styles.commissionRate, { color: currentPlanData.color }]}>
                {currentPlanData.commission}%
              </Text>
            </View>
            <Text style={styles.commissionSubtitle}>
              Sur vos {stats.monthlyRevenue.toLocaleString()} XOF ce mois
            </Text>
            <View style={styles.commissionCalculation}>
              <Text style={styles.commissionLabel}>Vous payez en commission :</Text>
              <Text style={styles.commissionAmount}>
                {(stats.monthlyRevenue * currentPlanData.commission / 100).toLocaleString()} XOF
              </Text>
            </View>
            {currentPlan !== 'free' && (
              <View style={styles.commissionCalculation}>
                <Text style={styles.commissionLabel}>Coût abonnement :</Text>
                <Text style={styles.commissionAmount}>
                  -{currentPlanData.price.toLocaleString()} XOF
                </Text>
              </View>
            )}
            <View style={[styles.netProfit, currentPlan === 'free' ? styles.netProfitWarning : styles.netProfitSuccess]}>
              <Text style={styles.netProfitLabel}>Vous gardez :</Text>
              <Text style={styles.netProfitAmount}>
                {(stats.monthlyRevenue * (100 - currentPlanData.commission) / 100 - currentPlanData.price).toLocaleString()} XOF
              </Text>
            </View>
          </View>

          {/* Si plan gratuit, montrer combien ils perdent */}
          {currentPlan === 'free' && stats.monthlyRevenue > 0 && (
            <View style={styles.lostMoneyAlert}>
              <TrendingDown size={24} color="#EF4444" />
              <View style={styles.lostMoneyContent}>
                <Text style={styles.lostMoneyTitle}>
                  ⚠️ Vous perdez de l'argent !
                </Text>
                <Text style={styles.lostMoneyText}>
                  Avec vos {stats.monthlyRevenue.toLocaleString()} XOF de revenus ce mois,
                  vous payez {(stats.monthlyRevenue * 0.2).toLocaleString()} XOF en commission (20%).
                </Text>
                <Text style={styles.lostMoneyHighlight}>
                  En passant à Starter, vous économiseriez {(stats.monthlyRevenue * 0.05).toLocaleString()} XOF !
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* COMPARAISON DES PLANS - ULTRA CONVAINCANTE */}
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>🔥 Et si vous changiez de plan ?</Text>
          <Text style={styles.comparisonSubtitle}>
            Calculé avec vos revenus réels de {stats.monthlyRevenue.toLocaleString()} XOF/mois
          </Text>

          {(Object.keys(subscriptionPlans) as SubscriptionPlanType[])
            .filter(planType => planType !== currentPlan)
            .map(planType => {
              const plan = subscriptionPlans[planType];
              const roi = calculateROI(planType);
              const PlanIcon = plan.icon;
              const isUpgrade = subscriptionPlans[planType].price > currentPlanData.price;

              return (
                <TouchableOpacity
                  key={planType}
                  style={[
                    styles.planComparisonCard,
                    { borderColor: plan.color },
                    roi.totalMonthlyBenefit > 0 && styles.planComparisonCardPositive,
                  ]}
                  onPress={() => router.push('/seller/subscription-plans')}>

                  {/* Header du plan */}
                  <View style={styles.planComparisonHeader}>
                    <View style={styles.planComparisonTitleRow}>
                      <Text style={styles.planComparisonEmoji}>{plan.emoji}</Text>
                      <View style={styles.planComparisonTitleContent}>
                        <Text style={styles.planComparisonName}>{plan.name}</Text>
                        <Text style={styles.planComparisonPrice}>
                          {plan.price > 0 ? `${plan.price.toLocaleString()} XOF/mois` : 'Gratuit'}
                        </Text>
                      </View>
                    </View>
                    {isUpgrade && (
                      <View style={styles.upgradeBadge}>
                        <ArrowUpCircle size={16} color="#10B981" />
                        <Text style={styles.upgradeBadgeText}>Upgrade</Text>
                      </View>
                    )}
                  </View>

                  {/* Calculs ROI */}
                  <View style={styles.roiCalculations}>
                    {/* Économie commission */}
                    {roi.commissionSaved !== 0 && (
                      <View style={styles.roiRow}>
                        <Text style={styles.roiLabel}>
                          💸 Économie commission ({currentPlanData.commission}% → {plan.commission}%):
                        </Text>
                        <Text style={[styles.roiValue, roi.commissionSaved > 0 ? styles.roiPositive : styles.roiNegative]}>
                          {roi.commissionSaved > 0 ? '+' : ''}{roi.commissionSaved.toLocaleString()} XOF
                        </Text>
                      </View>
                    )}

                    {/* Coût du plan */}
                    {roi.planCost > 0 && (
                      <View style={styles.roiRow}>
                        <Text style={styles.roiLabel}>💳 Coût mensuel:</Text>
                        <Text style={styles.roiNegative}>
                          -{roi.planCost.toLocaleString()} XOF
                        </Text>
                      </View>
                    )}

                    {/* Ventes supplémentaires estimées */}
                    {plan.visibilityBoost > 0 && (
                      <View style={styles.roiRow}>
                        <Text style={styles.roiLabel}>
                          📈 Ventes extra (+{plan.visibilityBoost}% visibilité):
                        </Text>
                        <Text style={styles.roiPositive}>
                          +{roi.estimatedExtraProfit.toLocaleString()} XOF
                        </Text>
                      </View>
                    )}

                    {/* Ligne de séparation */}
                    <View style={styles.roiDivider} />

                    {/* BÉNÉFICE NET TOTAL */}
                    <View style={styles.roiTotalRow}>
                      <Text style={styles.roiTotalLabel}>
                        {roi.totalMonthlyBenefit > 0 ? '✅ Bénéfice mensuel total :' : '⚠️ Coût net :'}
                      </Text>
                      <Text style={[
                        styles.roiTotalValue,
                        roi.totalMonthlyBenefit > 0 ? styles.roiTotalPositive : styles.roiTotalNegative
                      ]}>
                        {roi.totalMonthlyBenefit > 0 ? '+' : ''}
                        {roi.totalMonthlyBenefit.toLocaleString()} XOF
                      </Text>
                    </View>

                    {/* Message de conclusion */}
                    {roi.totalMonthlyBenefit > 0 ? (
                      <View style={styles.conclusionPositive}>
                        <CheckCircle size={16} color="#10B981" />
                        <Text style={styles.conclusionText}>
                          Ce plan vous rapporte {roi.totalMonthlyBenefit.toLocaleString()} XOF de plus par mois !
                        </Text>
                      </View>
                    ) : stats.monthlyRevenue < roi.breakEvenSales ? (
                      <View style={styles.conclusionNeutral}>
                        <Clock size={16} color="#F59E0B" />
                        <Text style={styles.conclusionText}>
                          Rentable à partir de {roi.breakEvenSales.toLocaleString()} XOF de ventes/mois
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.conclusionNegative}>
                        <Text style={styles.conclusionText}>
                          Pas rentable avec vos ventes actuelles
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* CTA Button */}
                  {roi.totalMonthlyBenefit > 0 && (
                    <View style={[styles.planCTA, { backgroundColor: plan.color }]}>
                      <Text style={styles.planCTAText}>
                        {isUpgrade ? 'Upgrader maintenant' : 'Voir ce plan'}
                      </Text>
                      <ChevronRight size={20} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Section Avantages Actuels */}
        <View style={styles.currentBenefitsSection}>
          <Text style={styles.sectionTitle}>⭐ Vos Avantages Actuels</Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIconContainer, { backgroundColor: '#10B98115' }]}>
                <DollarSign size={20} color="#10B981" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Commission {currentPlanData.commission}%</Text>
                <Text style={styles.benefitDescription}>
                  Sur chaque vente de 10,000 XOF, vous payez {currentPlanData.commission * 100} XOF
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={[styles.benefitIconContainer, { backgroundColor: '#8B5CF615' }]}>
                <Package size={20} color="#8B5CF6" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>
                  {currentPlanData.maxProducts === 999999 ? 'Produits illimités' : `${currentPlanData.maxProducts} produits max`}
                </Text>
                <Text style={styles.benefitDescription}>
                  Vous avez {stats.activeProducts}/{currentPlanData.maxProducts === 999999 ? '∞' : currentPlanData.maxProducts} produits actifs
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={[styles.benefitIconContainer, { backgroundColor: '#3B82F615' }]}>
                <Eye size={20} color="#3B82F6" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>
                  {currentPlanData.visibilityBoost > 0
                    ? `+${currentPlanData.visibilityBoost}% de visibilité`
                    : 'Visibilité standard'}
                </Text>
                <Text style={styles.benefitDescription}>
                  {currentPlanData.visibilityBoost > 0
                    ? `Vos produits apparaissent ${currentPlanData.visibilityBoost}% plus souvent`
                    : 'Visibilité de base dans les résultats'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Final */}
        <TouchableOpacity
          style={styles.finalCTA}
          onPress={() => router.push('/seller/subscription-plans')}>
          <Sparkles size={24} color="#FFFFFF" />
          <Text style={styles.finalCTAText}>
            Voir tous les plans d'abonnement
          </Text>
          <ChevronRight size={24} color="#FFFFFF" />
        </TouchableOpacity>

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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  becomeSellerButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
  },
  becomeSellerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Hero Section
  heroSection: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Stats Section
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // ROI Section
  roiSection: {
    padding: 20,
  },
  roiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  roiTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  currentCommissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 3,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  commissionRate: {
    fontSize: 32,
    fontWeight: '700',
  },
  commissionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  commissionCalculation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  commissionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  commissionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  netProfit: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netProfitWarning: {
    backgroundColor: '#FEF3C7',
  },
  netProfitSuccess: {
    backgroundColor: '#D1FAE5',
  },
  netProfitLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  netProfitAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  lostMoneyAlert: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  lostMoneyContent: {
    flex: 1,
  },
  lostMoneyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 8,
  },
  lostMoneyText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
    marginBottom: 8,
  },
  lostMoneyHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },

  // Comparison Section
  comparisonSection: {
    padding: 20,
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  planComparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  planComparisonCardPositive: {
    borderWidth: 3,
    shadowOpacity: 0.15,
  },
  planComparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planComparisonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  planComparisonEmoji: {
    fontSize: 32,
  },
  planComparisonTitleContent: {
    flex: 1,
  },
  planComparisonName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  planComparisonPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  upgradeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  roiCalculations: {
    gap: 8,
  },
  roiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  roiLabel: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  roiValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  roiPositive: {
    color: '#10B981',
  },
  roiNegative: {
    color: '#EF4444',
  },
  roiDivider: {
    height: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  roiTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginVertical: 8,
  },
  roiTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  roiTotalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  roiTotalPositive: {
    color: '#10B981',
  },
  roiTotalNegative: {
    color: '#EF4444',
  },
  conclusionPositive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    marginTop: 8,
  },
  conclusionNeutral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginTop: 8,
  },
  conclusionNegative: {
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginTop: 8,
  },
  conclusionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  planCTA: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  planCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Current Benefits
  currentBenefitsSection: {
    padding: 20,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Final CTA
  finalCTA: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  finalCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
