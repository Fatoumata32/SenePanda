import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Store,
  Phone,
  Crown,
  RefreshCw,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Activity,
  AlertCircle,
  Zap,
  BarChart3,
  Eye,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { speak, announceSuccess, announceError } from '@/lib/voiceGuide';
import * as Haptics from 'expo-haptics';
import { statsCache, PerformanceMonitor, useInteractionManager } from '@/lib/performance';

interface SubscriptionRequest {
  id: string;
  user_id: string;
  full_name: string;
  shop_name: string | null;
  phone: string | null;
  plan_type: string;
  billing_period: string;
  requested_at: string;
  plan_name: string;
  price_monthly: number;
  price_yearly: number;
}

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingRequests: number;
  activeLives: number;
  newUsersToday: number;
  ordersToday: number;
  revenueToday: number;
  averageOrderValue: number;
  topSellingProducts: number;
  activeSubscriptions: number;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingRequests: 0,
    activeLives: 0,
    newUsersToday: 0,
    ordersToday: 0,
    revenueToday: 0,
    averageOrderValue: 0,
    topSellingProducts: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    await Promise.all([
      loadPendingRequests(),
      loadStats(),
    ]);
  };

  const loadStats = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total sellers
      const { count: totalSellers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_seller', true);

      // Total orders
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Active lives
      const { count: activeLives } = await supabase
        .from('live_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // New users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('subscription_plan', 'free')
        .not('subscription_plan', 'is', null);

      // Orders today
      const { count: ordersToday, data: ordersTodayData } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', today.toISOString());

      // Calculate revenue today
      const revenueToday = ordersTodayData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Total revenue
      const { data: allOrders } = await supabase
        .from('orders')
        .select('total_amount');

      const totalRevenue = allOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const averageOrderValue = totalOrders && totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalSellers: totalSellers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        pendingRequests: requests.length,
        activeLives: activeLives || 0,
        newUsersToday: newUsersToday || 0,
        ordersToday: ordersToday || 0,
        revenueToday,
        averageOrderValue,
        topSellingProducts: 0,
        activeSubscriptions: activeSubscriptions || 0,
      });

    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_subscription_requests')
        .select('*')
        .order('requested_at', { ascending: true });

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('subscription_requests')
          .select(`
            id,
            user_id,
            plan_type,
            billing_period,
            requested_at,
            profiles!inner (
              full_name,
              shop_name,
              phone
            ),
            subscription_plans!inner (
              name,
              price_monthly,
              price_yearly
            )
          `)
          .eq('status', 'pending')
          .order('requested_at', { ascending: true });

        if (fallbackError) throw fallbackError;

        const transformedData = (fallbackData || []).map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          full_name: item.profiles?.full_name || 'Inconnu',
          shop_name: item.profiles?.shop_name,
          phone: item.profiles?.phone,
          plan_type: item.plan_type,
          billing_period: item.billing_period,
          requested_at: item.requested_at,
          plan_name: item.subscription_plans?.name || item.plan_type,
          price_monthly: item.subscription_plans?.price_monthly || 0,
          price_yearly: item.subscription_plans?.price_yearly || 0,
        }));

        setRequests(transformedData);
      } else {
        setRequests(data || []);
      }
    } catch (error: any) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (request: SubscriptionRequest) => {
    Alert.alert(
      'Confirmer l\'approbation',
      `Approuver l'abonnement ${request.plan_name} pour ${request.full_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(request.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              const { data, error } = await supabase.rpc('approve_subscription_request', {
                p_request_id: request.id,
                p_admin_id: null,
                p_admin_notes: 'Approuvé via dashboard admin mobile',
              });

              if (error) throw error;

              if (data?.success) {
                await announceSuccess('saved');
                await speak(`Abonnement ${request.plan_name} activé pour ${request.full_name}`);
                Alert.alert('Succès', `Abonnement ${request.plan_name} activé pour ${request.full_name}`);
                loadDashboardData();
              } else {
                throw new Error(data?.error || 'Erreur inconnue');
              }
            } catch (error: any) {
              console.error('Erreur approbation:', error);
              await announceError('general');
              Alert.alert('Erreur', error.message || 'Impossible d\'approuver la demande');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (request: SubscriptionRequest) => {
    Alert.alert(
      'Confirmer le rejet',
      `Rejeter la demande de ${request.full_name} pour le plan ${request.plan_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(request.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

              const { data, error } = await supabase.rpc('reject_subscription_request', {
                p_request_id: request.id,
                p_admin_id: null,
                p_admin_notes: 'Rejeté via dashboard admin mobile',
              });

              if (error) throw error;

              if (data?.success) {
                await speak('Demande rejetée');
                Alert.alert('Demande rejetée', `La demande de ${request.full_name} a été rejetée`);
                loadDashboardData();
              } else {
                throw new Error(data?.error || 'Erreur inconnue');
              }
            } catch (error: any) {
              console.error('Erreur rejet:', error);
              await announceError('general');
              Alert.alert('Erreur', error.message || 'Impossible de rejeter la demande');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (request: SubscriptionRequest) => {
    const price = request.billing_period === 'yearly' ? request.price_yearly : request.price_monthly;
    const period = request.billing_period === 'yearly' ? '/an' : '/mois';
    return `${price?.toLocaleString() || 0} FCFA${period}`;
  };

  const getPlanColor = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'starter':
        return '#3B82F6';
      case 'pro':
        return '#8B5CF6';
      case 'premium':
        return '#F59E0B';
      default:
        return Colors.textMuted;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
          <Text style={styles.loadingText}>Chargement du dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Vue d'ensemble de la plateforme</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setRefreshing(true);
            loadDashboardData();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.refreshButton}>
          <RefreshCw size={20} color={Colors.primaryOrange} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboardData();
            }}
            colors={[Colors.primaryOrange]}
          />
        }>

        {/* KPI Cards - Ligne 1 */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.kpiGradient}>
              <Users size={24} color="#FFFFFF" />
              <Text style={styles.kpiNumber}>{stats.totalUsers}</Text>
              <Text style={styles.kpiLabel}>Utilisateurs</Text>
              {stats.newUsersToday > 0 && (
                <View style={styles.kpiBadge}>
                  <TrendingUp size={12} color="#10B981" />
                  <Text style={styles.kpiBadgeText}>+{stats.newUsersToday}</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          <View style={[styles.kpiCard, styles.kpiCardSuccess]}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.kpiGradient}>
              <Store size={24} color="#FFFFFF" />
              <Text style={styles.kpiNumber}>{stats.totalSellers}</Text>
              <Text style={styles.kpiLabel}>Vendeurs</Text>
              <View style={styles.kpiBadge}>
                <Crown size={12} color="#F59E0B" />
                <Text style={styles.kpiBadgeText}>{stats.activeSubscriptions}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* KPI Cards - Ligne 2 */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, styles.kpiCardWarning]}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.kpiGradient}>
              <ShoppingBag size={24} color="#FFFFFF" />
              <Text style={styles.kpiNumber}>{stats.totalOrders}</Text>
              <Text style={styles.kpiLabel}>Commandes</Text>
              {stats.ordersToday > 0 && (
                <View style={styles.kpiBadge}>
                  <Activity size={12} color="#3B82F6" />
                  <Text style={styles.kpiBadgeText}>+{stats.ordersToday}</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          <View style={[styles.kpiCard, styles.kpiCardPurple]}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.kpiGradient}>
              <DollarSign size={24} color="#FFFFFF" />
              <Text style={styles.kpiNumber}>{(stats.totalRevenue / 1000).toFixed(0)}K</Text>
              <Text style={styles.kpiLabel}>Revenu Total</Text>
              {stats.revenueToday > 0 && (
                <View style={styles.kpiBadge}>
                  <TrendingUp size={12} color="#10B981" />
                  <Text style={styles.kpiBadgeText}>{(stats.revenueToday / 1000).toFixed(1)}K</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Insights rapides */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Insights Rapides</Text>

          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Zap size={20} color="#F59E0B" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Lives Actifs</Text>
              <Text style={styles.insightValue}>{stats.activeLives} en cours</Text>
            </View>
            <Eye size={20} color={Colors.textMuted} />
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <BarChart3 size={20} color="#3B82F6" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Panier Moyen</Text>
              <Text style={styles.insightValue}>{formatCurrency(stats.averageOrderValue)}</Text>
            </View>
            <TrendingUp size={20} color="#10B981" />
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <Clock size={20} color="#EF4444" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Demandes en Attente</Text>
              <Text style={styles.insightValue}>{requests.length} demandes</Text>
            </View>
            <AlertCircle size={20} color="#EF4444" />
          </View>
        </View>

        {/* Demandes d'abonnement */}
        {requests.length > 0 && (
          <View style={styles.requestsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Demandes d'Abonnement</Text>
              <View style={styles.urgentBadge}>
                <AlertCircle size={14} color="#EF4444" />
                <Text style={styles.urgentBadgeText}>{requests.length} à traiter</Text>
              </View>
            </View>

            {requests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                {/* Header de la carte */}
                <View style={styles.cardHeader}>
                  <View style={[styles.planBadge, { backgroundColor: getPlanColor(request.plan_type) }]}>
                    <Crown size={14} color={Colors.white} />
                    <Text style={styles.planBadgeText}>{request.plan_name}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(request.requested_at)}</Text>
                </View>

                {/* Infos utilisateur */}
                <View style={styles.userInfo}>
                  <View style={styles.infoRow}>
                    <User size={16} color={Colors.textMuted} />
                    <Text style={styles.infoText}>{request.full_name}</Text>
                  </View>
                  {request.shop_name && (
                    <View style={styles.infoRow}>
                      <Store size={16} color={Colors.textMuted} />
                      <Text style={styles.infoText}>{request.shop_name}</Text>
                    </View>
                  )}
                  {request.phone && (
                    <View style={styles.infoRow}>
                      <Phone size={16} color={Colors.textMuted} />
                      <Text style={styles.infoText}>{request.phone}</Text>
                    </View>
                  )}
                </View>

                {/* Prix et période */}
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>{formatPrice(request)}</Text>
                  <Text style={styles.periodText}>
                    {request.billing_period === 'yearly' ? 'Annuel' : 'Mensuel'}
                  </Text>
                </View>

                {/* Boutons d'action */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.rejectButton, processingId === request.id && styles.buttonDisabled]}
                    onPress={() => handleReject(request)}
                    disabled={processingId === request.id}>
                    {processingId === request.id ? (
                      <ActivityIndicator size="small" color={Colors.error} />
                    ) : (
                      <>
                        <XCircle size={18} color={Colors.error} />
                        <Text style={styles.rejectButtonText}>Rejeter</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.approveButton, processingId === request.id && styles.buttonDisabled]}
                    onPress={() => handleApprove(request)}
                    disabled={processingId === request.id}>
                    {processingId === request.id ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <CheckCircle size={18} color={Colors.white} />
                        <Text style={styles.approveButtonText}>Approuver</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {requests.length === 0 && (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color={Colors.successGreen} />
            <Text style={styles.emptyTitle}>Tout est à jour !</Text>
            <Text style={styles.emptyText}>Aucune demande d'abonnement en attente</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
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
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  kpiCardPrimary: {},
  kpiCardSuccess: {},
  kpiCardWarning: {},
  kpiCardPurple: {},
  kpiGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
    marginTop: Spacing.sm,
  },
  kpiLabel: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    marginTop: Spacing.xs,
  },
  kpiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  kpiBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  insightsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  insightValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  requestsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  urgentBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  planBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  userInfo: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  priceText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryOrange,
  },
  periodText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
  },
  rejectButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.error,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.successGreen,
  },
  approveButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
