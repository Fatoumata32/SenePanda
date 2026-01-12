import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Video,
  Plus,
  Eye,
  Users,
  ShoppingBag,
  Calendar,
  Play,
  Trash2,
  Edit3,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { LiveSession } from '@/hooks/useLiveShopping';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

type LiveSessionWithStats = LiveSession & {
  product_count?: number;
};

export default function MyLivesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { limits } = useSubscriptionLimits();

  const [activeLives, setActiveLives] = useState<LiveSessionWithStats[]>([]);
  const [scheduledLives, setScheduledLives] = useState<LiveSessionWithStats[]>([]);
  const [pastLives, setPastLives] = useState<LiveSessionWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'scheduled' | 'past'>('active');

  useEffect(() => {
    loadLiveSessions();
  }, []);

  const loadLiveSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger toutes les sessions du vendeur
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          live_featured_products (count)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessions: LiveSessionWithStats[] = (data || []).map((session: any) => ({
        ...session,
        product_count: session.live_featured_products?.[0]?.count || 0,
      }));

      // Séparer par statut
      setActiveLives(sessions.filter(s => s.status === 'live'));
      setScheduledLives(sessions.filter(s => s.status === 'scheduled'));
      setPastLives(sessions.filter(s => s.status === 'ended' || s.status === 'cancelled'));
    } catch (error) {
      console.error('Error loading live sessions:', error);
      Alert.alert('Erreur', 'Impossible de charger vos lives');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLiveSessions();
  };

  const startLive = async (sessionId: string) => {
    try {
      // Vérifier l'abonnement
      if (!limits.can_create_live) {
        Alert.alert(
          'Abonnement requis',
          limits.upgrade_message || 'Le Live Shopping est réservé aux abonnés Premium et Pro.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Voir les abonnements',
              onPress: () => router.push('/seller/subscription-plans' as any),
            },
          ]
        );
        return;
      }

      // Vérifier la limite de lives concurrents
      if (activeLives.length >= limits.max_concurrent_lives) {
        Alert.alert(
          'Limite atteinte',
          `Votre plan ${limits.plan_type.toUpperCase()} permet ${limits.max_concurrent_lives} live${limits.max_concurrent_lives > 1 ? 's' : ''} simultané${limits.max_concurrent_lives > 1 ? 's' : ''}. Terminez un live actif avant d'en démarrer un nouveau.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Vérifier s'il y a déjà un live actif (sécurité supplémentaire)
      if (activeLives.length > 0 && limits.max_concurrent_lives === 1) {
        const otherLive = activeLives.find(l => l.id !== sessionId);
        if (otherLive) {
          Alert.alert(
            'Live déjà actif',
            `Vous avez déjà un live en cours: "${otherLive.title}". Terminez-le avant d'en démarrer un autre.`,
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const { error } = await supabase.rpc('start_live_session', {
        session_id: sessionId
      });

      if (error) throw error;

      // IMPORTANT: Pour Expo Go, utiliser Agora ([id].tsx)
      // Pour build natif: changer vers zego-stream
      router.push({
        pathname: '/seller/live-stream/[id]',
        params: { id: sessionId }
      } as any);
    } catch (error) {
      console.error('Error starting live:', error);
      Alert.alert('Erreur', 'Impossible de démarrer le live');
    }
  };

  const deleteLive = async (sessionId: string, title: string) => {
    Alert.alert(
      'Supprimer le live',
      `Êtes-vous sûr de vouloir supprimer "${title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('live_sessions')
                .delete()
                .eq('id', sessionId);

              if (error) throw error;

              Alert.alert('Succès', 'Live supprimé');
              loadLiveSessions();
            } catch (error) {
              console.error('Error deleting live:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le live');
            }
          },
        },
      ]
    );
  };

  const deleteAllScheduled = async () => {
    if (scheduledLives.length === 0) return;

    Alert.alert(
      'Supprimer tous les lives programmés',
      `Êtes-vous sûr de vouloir supprimer les ${scheduledLives.length} live(s) programmé(s) ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: `Supprimer tout (${scheduledLives.length})`,
          style: 'destructive',
          onPress: async () => {
            try {
              const sessionIds = scheduledLives.map(s => s.id);

              const { error } = await supabase
                .from('live_sessions')
                .delete()
                .in('id', sessionIds);

              if (error) throw error;

              Alert.alert('Succès', `${scheduledLives.length} live(s) supprimé(s)`);
              loadLiveSessions();
            } catch (error) {
              console.error('Error deleting all scheduled lives:', error);
              Alert.alert('Erreur', 'Impossible de supprimer les lives');
            }
          },
        },
      ]
    );
  };

  const deleteAllPast = async () => {
    if (pastLives.length === 0) return;

    Alert.alert(
      'Nettoyer l\'historique',
      `Supprimer les ${pastLives.length} live(s) terminé(s) ?\n\nCela libérera de l'espace et nettoiera votre historique.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: `Tout supprimer (${pastLives.length})`,
          style: 'destructive',
          onPress: async () => {
            try {
              const sessionIds = pastLives.map(s => s.id);

              const { error } = await supabase
                .from('live_sessions')
                .delete()
                .in('id', sessionIds);

              if (error) throw error;

              Alert.alert('Succès', `Historique nettoyé (${pastLives.length} lives supprimés)`);
              loadLiveSessions();
            } catch (error) {
              console.error('Error deleting past lives:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'historique');
            }
          },
        },
      ]
    );
  };

  const endAllActiveLives = async () => {
    if (activeLives.length === 0) return;

    Alert.alert(
      'Terminer tous les lives en direct',
      `Voulez-vous terminer ${activeLives.length === 1 ? 'le live en direct' : `les ${activeLives.length} lives en direct`} ?\n\nLes spectateurs seront déconnectés et les lives seront archivés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: `Terminer ${activeLives.length === 1 ? 'le live' : `tout (${activeLives.length})`}`,
          style: 'destructive',
          onPress: async () => {
            try {
              // Terminer chaque live actif
              const promises = activeLives.map(live =>
                supabase.rpc('end_live_session', { session_id: live.id })
              );

              const results = await Promise.all(promises);

              // Vérifier les erreurs
              const hasError = results.some(result => result.error);
              if (hasError) {
                throw new Error('Erreur lors de la terminaison de certains lives');
              }

              Alert.alert('Succès', `${activeLives.length} live(s) terminé(s)`);
              loadLiveSessions();
            } catch (error) {
              console.error('Error ending all active lives:', error);
              Alert.alert('Erreur', 'Impossible de terminer tous les lives');
            }
          },
        },
      ]
    );
  };

  const renderLiveCard = (session: LiveSessionWithStats) => {
    const isActive = session.status === 'live';
    const isScheduled = session.status === 'scheduled';
    const isPast = session.status === 'ended' || session.status === 'cancelled';

    const statusColor = isActive ? Colors.error : isScheduled ? Colors.warning : Colors.textMuted;
    const statusIcon = isActive ? CheckCircle : isScheduled ? Clock : XCircle;
    const statusText = isActive ? 'EN DIRECT' : isScheduled ? 'PROGRAMMÉ' : session.status === 'ended' ? 'TERMINÉ' : 'ANNULÉ';

    return (
      <View key={session.id} style={styles.liveCard}>
        {/* Header avec statut */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            {React.createElement(statusIcon, { size: 14, color: statusColor })}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>

          {isActive && (
            <View style={styles.livePulse}>
              <View style={styles.liveDot} />
            </View>
          )}
        </View>

        {/* Titre */}
        <Text style={styles.liveTitle} numberOfLines={2}>
          {session.title}
        </Text>

        {session.description && (
          <Text style={styles.liveDescription} numberOfLines={2}>
            {session.description}
          </Text>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Eye size={16} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{session.viewer_count || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Users size={16} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{session.total_views || 0}</Text>
          </View>
          <View style={styles.stat}>
            <ShoppingBag size={16} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{session.product_count || 0}</Text>
          </View>
        </View>

        {/* Date */}
        {session.scheduled_at && (
          <View style={styles.dateRow}>
            <Calendar size={14} color={Colors.textMuted} />
            <Text style={styles.dateText}>
              {new Date(session.scheduled_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          {isScheduled && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => startLive(session.id)}
            >
              <Play size={16} color={Colors.white} />
              <Text style={styles.startButtonText}>Démarrer</Text>
            </TouchableOpacity>
          )}

          {isActive && (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={() => router.push({
                pathname: '/seller/live-stream/[id]',
                params: { id: session.id }
              } as any)}
            >
              <Video size={16} color={Colors.white} />
              <Text style={styles.joinButtonText}>Rejoindre</Text>
            </TouchableOpacity>
          )}

          {!isActive && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteLive(session.id, session.title)}
            >
              <Trash2 size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const currentList = selectedTab === 'active' ? activeLives : selectedTab === 'scheduled' ? scheduledLives : pastLives;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/home');
            }
          }}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Lives</Text>
        <TouchableOpacity
          onPress={() => router.push('/seller/start-live' as any)}
        >
          <LinearGradient
            colors={['#F59E0B', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <Plus size={24} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
            onPress={() => setSelectedTab('active')}
          >
            <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
              En direct ({activeLives.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'scheduled' && styles.tabActive]}
            onPress={() => setSelectedTab('scheduled')}
          >
            <Text style={[styles.tabText, selectedTab === 'scheduled' && styles.tabTextActive]}>
              Programmés ({scheduledLives.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'past' && styles.tabActive]}
            onPress={() => setSelectedTab('past')}
          >
            <Text style={[styles.tabText, selectedTab === 'past' && styles.tabTextActive]}>
              Historique ({pastLives.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bouton d'action groupée (intelligent selon le tab) */}
        {selectedTab === 'active' && activeLives.length > 0 && (
          <TouchableOpacity
            style={styles.endAllButton}
            onPress={endAllActiveLives}
          >
            <XCircle size={16} color={Colors.white} />
            <Text style={styles.endAllText}>
              Terminer {activeLives.length === 1 ? 'le live' : `tout (${activeLives.length})`}
            </Text>
          </TouchableOpacity>
        )}

        {selectedTab === 'scheduled' && scheduledLives.length > 0 && (
          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={deleteAllScheduled}
          >
            <Trash2 size={16} color={Colors.error} />
            <Text style={styles.deleteAllText}>
              Tout supprimer ({scheduledLives.length})
            </Text>
          </TouchableOpacity>
        )}

        {selectedTab === 'past' && pastLives.length > 0 && (
          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={deleteAllPast}
          >
            <Trash2 size={16} color={Colors.error} />
            <Text style={styles.deleteAllText}>
              Nettoyer ({pastLives.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primaryOrange]} />
          }
        >
          {currentList.length > 0 ? (
            currentList.map(renderLiveCard)
          ) : (
            <View style={styles.emptyState}>
              <Video size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {selectedTab === 'active' && 'Aucun live en cours'}
                {selectedTab === 'scheduled' && 'Aucun live programmé'}
                {selectedTab === 'past' && 'Aucun live terminé'}
              </Text>
              <Text style={styles.emptyText}>
                {selectedTab !== 'past' && 'Créez votre premier live shopping'}
              </Text>
              {selectedTab !== 'past' && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/seller/start-live' as any)}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyButtonGradient}
                  >
                    <Plus size={20} color={Colors.white} />
                    <Text style={styles.emptyButtonText}>Créer un live</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  tabsContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primaryOrange,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primaryOrange,
  },
  endAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.error,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  endAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.errorLight,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  deleteAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.error,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  livePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    opacity: 0.5,
  },
  liveTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  liveDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  startButton: {
    backgroundColor: Colors.success,
  },
  startButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  joinButton: {
    backgroundColor: Colors.error,
  },
  joinButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.errorLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.lg,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.medium,
  },
  emptyButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.white,
  },
});
