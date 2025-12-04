import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
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
} from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

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

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      // Charger depuis la vue pending_subscription_requests
      const { data, error } = await supabase
        .from('pending_subscription_requests')
        .select('*')
        .order('requested_at', { ascending: true });

      if (error) {
        console.error('Erreur vue:', error);
        // Fallback: charger directement depuis subscription_requests
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

        // Transformer les données
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
      Alert.alert('Erreur', 'Impossible de charger les demandes');
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

              // Appeler la fonction approve_subscription_request
              const { data, error } = await supabase.rpc('approve_subscription_request', {
                p_request_id: request.id,
                p_admin_id: null, // Pas d'ID admin pour le moment
                p_admin_notes: 'Approuvé via dashboard admin mobile',
              });

              if (error) throw error;

              if (data?.success) {
                Alert.alert('Succès', `Abonnement ${request.plan_name} activé pour ${request.full_name}`);
                loadPendingRequests();
              } else {
                throw new Error(data?.error || 'Erreur inconnue');
              }
            } catch (error: any) {
              console.error('Erreur approbation:', error);
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

              // Appeler la fonction reject_subscription_request
              const { data, error } = await supabase.rpc('reject_subscription_request', {
                p_request_id: request.id,
                p_admin_id: null,
                p_admin_notes: 'Rejeté via dashboard admin mobile',
              });

              if (error) throw error;

              if (data?.success) {
                Alert.alert('Demande rejetée', `La demande de ${request.full_name} a été rejetée`);
                loadPendingRequests();
              } else {
                throw new Error(data?.error || 'Erreur inconnue');
              }
            } catch (error: any) {
              console.error('Erreur rejet:', error);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
          <Text style={styles.loadingText}>Chargement des demandes...</Text>
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
        <Text style={styles.headerTitle}>Administration</Text>
        <TouchableOpacity onPress={() => loadPendingRequests()} style={styles.refreshButton}>
          <RefreshCw size={20} color={Colors.primaryOrange} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Clock size={24} color={Colors.warning} />
          <Text style={styles.statNumber}>{requests.length}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
      </View>

      {/* Liste des demandes */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPendingRequests();
            }}
            colors={[Colors.primaryOrange]}
          />
        }>
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color={Colors.successGreen} />
            <Text style={styles.emptyTitle}>Tout est à jour !</Text>
            <Text style={styles.emptyText}>Aucune demande d'abonnement en attente</Text>
          </View>
        ) : (
          requests.map((request) => (
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
          ))
        )}
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
  refreshButton: {
    padding: Spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.small,
  },
  statNumber: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
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
