import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import {
  Gift,
  Flame,
  Trophy,
  Star,
  MessageSquare,
  FileText,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

interface PointsData {
  available_points: number;
  lifetime_points: number;
  current_streak: number;
  longest_streak: number;
  welcome_bonus_claimed: boolean;
  last_login_date: string | null;
}

interface BonusOpportunity {
  id: string;
  icon: any;
  title: string;
  description: string;
  points: number;
  color: string;
  action: () => void;
}

export default function PointsDashboard() {
  const { user } = useAuth();
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [canClaimDaily, setCanClaimDaily] = useState(false);

  useEffect(() => {
    if (user) {
      loadPointsData();
    }
  }, [user]);

  const loadPointsData = async () => {
    if (!user) return;

    try {
      // Charger les points depuis loyalty_points
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_points')
        .select('available_points, lifetime_points')
        .eq('user_id', user.id)
        .single();

      if (loyaltyError && loyaltyError.code !== 'PGRST116') {
        throw loyaltyError;
      }

      // Charger les données de profil (streak, etc.)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, welcome_bonus_claimed, last_login_date')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const combined: PointsData = {
        available_points: loyaltyData?.available_points || 0,
        lifetime_points: loyaltyData?.lifetime_points || 0,
        current_streak: profileData?.current_streak || 0,
        longest_streak: profileData?.longest_streak || 0,
        welcome_bonus_claimed: profileData?.welcome_bonus_claimed || false,
        last_login_date: profileData?.last_login_date || null,
      };

      setPointsData(combined);

      // Vérifier si peut réclamer le bonus quotidien
      const today = new Date().toISOString().split('T')[0];
      const canClaim = !combined.last_login_date || combined.last_login_date !== today;
      setCanClaimDaily(canClaim);

      // Auto-claim welcome bonus si non réclamé
      if (!combined.welcome_bonus_claimed) {
        await claimWelcomeBonus();
      }
    } catch (error: any) {
      console.error('Error loading points data:', error);
    }
  };

  const claimWelcomeBonus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('award_welcome_bonus', {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data?.success) {
        Alert.alert(
          '🎉 Bienvenue !',
          data.message || `Vous avez reçu ${data.points} points de bienvenue !`,
          [{ text: 'Merci !', onPress: () => loadPointsData() }]
        );
      }
    } catch (error: any) {
      console.error('Error claiming welcome bonus:', error);
    }
  };

  const claimDailyBonus = async () => {
    if (!user || !canClaimDaily) return;

    setClaimingDaily(true);
    try {
      const { data, error } = await supabase.rpc('record_daily_login', {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data?.success) {
        Alert.alert(
          '🔥 Connexion quotidienne !',
          data.message || `+${data.points} points`,
          [{ text: 'Super !', onPress: () => loadPointsData() }]
        );
      } else {
        Alert.alert('Info', data?.message || 'Déjà réclamé aujourd\'hui');
      }
    } catch (error: any) {
      console.error('Error claiming daily bonus:', error);
      Alert.alert('Erreur', 'Impossible de réclamer le bonus quotidien');
    } finally {
      setClaimingDaily(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPointsData();
    setRefreshing(false);
  };

  const bonusOpportunities: BonusOpportunity[] = [
    {
      id: 'surveys',
      icon: FileText,
      title: 'Répondre aux sondages',
      description: 'Jusqu\'à 50 points par sondage',
      points: 50,
      color: '#8B5CF6',
      action: () => {
        // Navigate to surveys
        Alert.alert('Sondages', 'Les sondages seront bientôt disponibles !');
      },
    },
    {
      id: 'reviews',
      icon: MessageSquare,
      title: 'Laisser des avis',
      description: '20 points par commentaire',
      points: 20,
      color: '#10B981',
      action: () => {
        Alert.alert('Avis', 'Achetez des produits et laissez vos avis pour gagner des points !');
      },
    },
    {
      id: 'ratings',
      icon: Star,
      title: 'Noter les produits',
      description: '5 points par note',
      points: 5,
      color: '#F59E0B',
      action: () => {
        Alert.alert('Notes', 'Notez les produits pour gagner des points !');
      },
    },
  ];

  if (!pointsData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Points Overview Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <View style={styles.pointsIconContainer}>
            <Award size={32} color={Colors.primary} />
          </View>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>Points disponibles</Text>
            <Text style={styles.pointsValue}>{pointsData.available_points.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.pointsDivider} />
        <View style={styles.lifetimePoints}>
          <TrendingUp size={16} color={Colors.textMuted} />
          <Text style={styles.lifetimeText}>
            {pointsData.lifetime_points.toLocaleString()} points gagnés au total
          </Text>
        </View>
      </View>

      {/* Daily Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <View style={styles.streakIconContainer}>
            <Flame size={24} color="#F97316" />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>Série quotidienne</Text>
            <Text style={styles.streakValue}>
              {pointsData.current_streak} {pointsData.current_streak > 1 ? 'jours' : 'jour'}
            </Text>
          </View>
          {canClaimDaily && (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={claimDailyBonus}
              disabled={claimingDaily}
            >
              <Zap size={16} color={Colors.white} />
              <Text style={styles.claimButtonText}>
                {claimingDaily ? 'Réclamation...' : 'Réclamer'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.streakProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((pointsData.current_streak / 7) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {7 - (pointsData.current_streak % 7)} jours avant le prochain bonus (+50 points)
          </Text>
        </View>
        {pointsData.longest_streak > 0 && (
          <View style={styles.bestStreak}>
            <Trophy size={14} color="#F59E0B" />
            <Text style={styles.bestStreakText}>
              Meilleure série : {pointsData.longest_streak} jours
            </Text>
          </View>
        )}
      </View>

      {/* Bonus Opportunities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gagner plus de points</Text>
        {bonusOpportunities.map((bonus) => {
          const Icon = bonus.icon;
          return (
            <TouchableOpacity
              key={bonus.id}
              style={styles.bonusCard}
              onPress={bonus.action}
              activeOpacity={0.7}
            >
              <View style={[styles.bonusIconContainer, { backgroundColor: `${bonus.color}15` }]}>
                <Icon size={24} color={bonus.color} />
              </View>
              <View style={styles.bonusInfo}>
                <Text style={styles.bonusTitle}>{bonus.title}</Text>
                <Text style={styles.bonusDescription}>{bonus.description}</Text>
              </View>
              <View style={[styles.bonusPoints, { backgroundColor: `${bonus.color}15` }]}>
                <Text style={[styles.bonusPointsText, { color: bonus.color }]}>
                  +{bonus.points}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Tips */}
      <View style={styles.tipsCard}>
        <Gift size={20} color={Colors.primary} />
        <View style={styles.tipsContent}>
          <Text style={styles.tipsTitle}>Astuce</Text>
          <Text style={styles.tipsText}>
            Connectez-vous chaque jour pour maintenir votre série et gagner des bonus !
            Tous les 7 jours : +50 points. 30 jours : +100 points supplémentaires.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLight,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  pointsCard: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pointsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  pointsDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  lifetimePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  lifetimeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  streakCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  streakValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: '#F97316',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  claimButtonText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  streakProgress: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  bestStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bestStreakText: {
    fontSize: Typography.fontSize.xs,
    color: '#F59E0B',
    fontWeight: Typography.fontWeight.medium,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  bonusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  bonusDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  bonusPoints: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  bonusPointsText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}10`,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
