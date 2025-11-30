import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  Award,
  Gift,
  Users,
  TrendingUp,
  Coins,
  Star,
  CheckCircle,
  Clock,
  ShoppingBag,
  MessageSquare,
  Zap,
  Calendar,
  Sparkles,
  ArrowRight,
  Trophy,
  Lightbulb,
  X,
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type LoyaltyPoints = {
  points: number;
  total_earned: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
};

type ClaimedReward = {
  id: string;
  reward_id: string;
  points_spent: number;
  status: 'active' | 'used' | 'expired';
  expires_at: string | null;
  created_at: string;
  rewards: {
    title: string;
    description: string | null;
    reward_type: string;
    reward_value: number | null;
  };
};

type Referral = {
  id: string;
  referred_id: string;
  status: string;
  created_at: string;
  profiles: {
    username: string | null;
  };
};

const LEVEL_CONFIG = {
  bronze: {
    name: 'Bronze',
    color: '#CD7F32',
    gradient: ['#CD7F32', '#A0522D'],
    icon: '🥉',
    minPoints: 0,
    nextLevel: 1000,
    nextLevelName: 'Argent',
  },
  silver: {
    name: 'Argent',
    color: '#C0C0C0',
    gradient: ['#C0C0C0', '#A8A8A8'],
    icon: '🥈',
    minPoints: 1000,
    nextLevel: 5000,
    nextLevelName: 'Or',
  },
  gold: {
    name: 'Or',
    color: '#FFD700',
    gradient: ['#FFD700', '#FFA500'],
    icon: '🥇',
    minPoints: 5000,
    nextLevel: 15000,
    nextLevelName: 'Platine',
  },
  platinum: {
    name: 'Platine',
    color: '#E5E4E2',
    gradient: ['#E5E4E2', '#B9F2FF'],
    icon: '💎',
    minPoints: 15000,
    nextLevel: null,
    nextLevelName: null,
  },
};

const EARNING_METHODS = [
  {
    icon: ShoppingBag,
    title: 'Acheter des produits',
    points: '+1 point par 1000 FCFA',
    color: '#F59E0B',
    action: 'shop',
  },
  {
    icon: MessageSquare,
    title: 'Laisser un avis',
    points: '+50 points',
    color: '#3B82F6',
    action: 'reviews',
  },
  {
    icon: Users,
    title: 'Parrainer un ami',
    points: '+200 points',
    color: '#10B981',
    action: 'referral',
  },
  {
    icon: Gift,
    title: 'Échanger des points',
    points: 'Réductions & avantages',
    color: '#8B5CF6',
    action: 'rewards',
  },
];

// Astuces style Shopify - rotation quotidienne
const DAILY_TIPS = [
  {
    id: 1,
    icon: Coins,
    color: '#F59E0B',
    title: 'Maximisez vos points',
    description: 'Laissez un avis après chaque achat pour gagner 50 points bonus instantanément!',
    action: 'Voir mes commandes',
    route: '/orders',
  },
  {
    id: 2,
    icon: Users,
    color: '#10B981',
    title: 'Parrainage = Argent',
    description: 'Invitez 5 amis et gagnez 1000 points (équivalent à 10 000 FCFA de réductions)!',
    action: 'Parrainer maintenant',
    route: '/referral',
  },
  {
    id: 3,
    icon: Gift,
    color: '#8B5CF6',
    title: 'Utilisez vos récompenses',
    description: 'Les bons de réduction expirent après 30 jours. Utilisez-les avant qu\'ils ne disparaissent!',
    action: 'Mes récompenses',
    route: '/rewards/shop',
  },
  {
    id: 4,
    icon: ShoppingBag,
    color: '#3B82F6',
    title: 'Achetez malin',
    description: 'Chaque 1000 FCFA dépensé = 1 point gagné. Groupez vos achats pour plus de points!',
    action: 'Découvrir',
    route: '/(tabs)',
  },
  {
    id: 5,
    icon: Star,
    color: '#F59E0B',
    title: 'Niveau supérieur = Plus d\'avantages',
    description: 'Passez au niveau Argent (1000 points) pour débloquer des récompenses exclusives!',
    action: 'Voir les niveaux',
    route: '/my-benefits',
  },
  {
    id: 6,
    icon: Trophy,
    color: '#EF4444',
    title: 'Récompenses limitées',
    description: 'Certaines récompenses ont un stock limité. Échangez vos points rapidement!',
    action: 'Boutique récompenses',
    route: '/rewards/shop',
  },
  {
    id: 7,
    icon: TrendingUp,
    color: '#10B981',
    title: 'Meilleur ROI',
    description: 'Les récompenses de 2500 FCFA offrent le meilleur rapport points/valeur (ratio 1:12.5)!',
    action: 'Voir les offres',
    route: '/rewards/shop',
  },
];

export default function MyBenefitsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyPoints | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showTip, setShowTip] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
    // Rotation quotidienne des astuces
    const today = new Date().getDate();
    setCurrentTip(today % DAILY_TIPS.length);
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      if (!refreshing) setLoading(true);

      // Charger les points de fidélité
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('points, total_earned, level')
        .eq('user_id', user.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') throw pointsError;

      if (pointsData) {
        setLoyaltyData(pointsData);
      } else {
        // Créer une entrée par défaut
        const { data: newData } = await supabase
          .from('loyalty_points')
          .insert({
            user_id: user.id,
            points: 0,
            total_earned: 0,
            level: 'bronze',
          })
          .select('points, total_earned, level')
          .single();

        setLoyaltyData(newData || { points: 0, total_earned: 0, level: 'bronze' });
      }

      // Charger les récompenses actives
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('claimed_rewards')
        .select(`
          id,
          reward_id,
          points_spent,
          status,
          expires_at,
          created_at,
          rewards (
            title,
            description,
            reward_type,
            reward_value
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'used'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (rewardsError) {
        console.error('Error loading rewards:', rewardsError);
        // Fallback: charger sans la relation
        const { data: fallbackRewards } = await supabase
          .from('claimed_rewards')
          .select('id, reward_id, points_spent, status, expires_at, created_at')
          .eq('user_id', user.id)
          .in('status', ['active', 'used'])
          .order('created_at', { ascending: false })
          .limit(10);

        // Charger manuellement les détails des récompenses
        if (fallbackRewards && fallbackRewards.length > 0) {
          const rewardIds = fallbackRewards.map(r => r.reward_id);
          const { data: rewardsDetails } = await supabase
            .from('rewards')
            .select('id, title, description, reward_type, reward_value')
            .in('id', rewardIds);

          const rewardsMap = new Map(rewardsDetails?.map(r => [r.id, r]) || []);

          const enrichedRewards = fallbackRewards.map(r => ({
            ...r,
            rewards: rewardsMap.get(r.reward_id) || {
              title: 'Récompense',
              description: null,
              reward_type: 'unknown',
              reward_value: null,
            },
          }));

          setClaimedRewards(enrichedRewards as any);
        }
      } else {
        setClaimedRewards(rewardsData as any || []);
      }

      // Charger les parrainages
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_id,
          status,
          created_at,
          profiles!referrals_referred_id_fkey (
            username
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      setReferrals(referralsData as any || []);

    } catch (error) {
      console.error('Error loading benefits data:', error);
      Alert.alert('Erreur', 'Impossible de charger vos avantages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleActionPress = (action: string) => {
    switch (action) {
      case 'shop':
        router.push('/(tabs)/home');
        break;
      case 'reviews':
        router.push('/(tabs)/home');
        break;
      case 'referral':
        router.push('/referral');
        break;
      case 'rewards':
        router.push('/rewards/shop');
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Chargement de vos avantages...</Text>
      </View>
    );
  }

  const level = loyaltyData?.level || 'bronze';
  const levelConfig = LEVEL_CONFIG[level];
  const currentPoints = loyaltyData?.points || 0;
  const totalEarned = loyaltyData?.total_earned || 0;
  const activeRewards = claimedRewards.filter(r => r.status === 'active');
  const usedRewards = claimedRewards.filter(r => r.status === 'used');
  const activeReferrals = referrals.filter(r => r.status === 'active').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

  // Calculer la progression vers le niveau suivant
  const progressToNextLevel = levelConfig.nextLevel
    ? ((currentPoints - levelConfig.minPoints) / (levelConfig.nextLevel - levelConfig.minPoints)) * 100
    : 100;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Mes Avantages',
          headerShown: true,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section - Points & Niveau */}
        <LinearGradient
          colors={levelConfig.gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Text style={styles.levelEmoji}>{levelConfig.icon}</Text>
            <Text style={styles.levelName}>Niveau {levelConfig.name}</Text>
            <View style={styles.pointsContainer}>
              <Coins size={32} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.pointsAmount}>{currentPoints.toLocaleString()}</Text>
            </View>
            <Text style={styles.pointsLabel}>Panda Coins</Text>
          </View>
        </LinearGradient>

        {/* Progression vers le niveau suivant */}
        {levelConfig.nextLevel && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                Progression vers {levelConfig.nextLevelName}
              </Text>
              <Text style={styles.progressPoints}>
                {currentPoints.toLocaleString()} / {levelConfig.nextLevel.toLocaleString()}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progressToNextLevel, 100)}%`,
                    backgroundColor: levelConfig.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressSubtitle}>
              Plus que {(levelConfig.nextLevel - currentPoints).toLocaleString()} points !
            </Text>
          </View>
        )}

        {/* Astuce du jour - Style Shopify Premium */}
        {showTip && (
          <TouchableOpacity
            style={styles.tipContainer}
            activeOpacity={0.95}
            onPress={() => router.push(DAILY_TIPS[currentTip].route as any)}
          >
            {/* Gradient Background */}
            <LinearGradient
              colors={['#FFFFFF', '#FFFBEB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tipGradient}
            >
              {/* Close Button */}
              <TouchableOpacity
                style={styles.tipCloseButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowTip(false);
                }}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>

              {/* Decorative circles */}
              <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
              <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />

              <View style={styles.tipMainContent}>
                {/* Icon with glow effect */}
                <View style={styles.tipIconWrapper}>
                  <View style={[styles.tipIconGlow, { backgroundColor: DAILY_TIPS[currentTip].color + '20' }]} />
                  <View style={[styles.tipIconContainer, { backgroundColor: DAILY_TIPS[currentTip].color + '15' }]}>
                    {(() => {
                      const TipIcon = DAILY_TIPS[currentTip].icon;
                      return <TipIcon size={32} color={DAILY_TIPS[currentTip].color} strokeWidth={2.5} />;
                    })()}
                  </View>
                </View>

                <View style={styles.tipContent}>
                  {/* Header with badge */}
                  <View style={styles.tipHeader}>
                    <View style={styles.tipBadgeContainer}>
                      <Lightbulb size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.tipBadge}>ASTUCE DU JOUR</Text>
                      <View style={styles.tipBadgeDot} />
                    </View>
                  </View>

                  {/* Title with emphasis */}
                  <Text style={styles.tipTitle}>
                    {DAILY_TIPS[currentTip].title}
                  </Text>

                  {/* Description */}
                  <Text style={styles.tipDescription}>
                    {DAILY_TIPS[currentTip].description}
                  </Text>

                  {/* Action button with arrow */}
                  <View style={styles.tipActionWrapper}>
                    <View style={[styles.tipAction, { backgroundColor: DAILY_TIPS[currentTip].color }]}>
                      <Text style={styles.tipActionText}>{DAILY_TIPS[currentTip].action}</Text>
                      <View style={styles.tipActionArrow}>
                        <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats rapides */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98115' }]}>
              <Trophy size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{totalEarned.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Points gagnés</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
              <Gift size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{activeRewards.length}</Text>
            <Text style={styles.statLabel}>Récompenses actives</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F615' }]}>
              <Users size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{activeReferrals}</Text>
            <Text style={styles.statLabel}>Parrainages réussis</Text>
          </View>
        </View>

        {/* Récompenses actives */}
        {activeRewards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Gift size={24} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Vos Récompenses Actives</Text>
            </View>

            {activeRewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardContent}>
                  <View style={styles.rewardHeader}>
                    <Text style={styles.rewardTitle}>{reward.rewards.title}</Text>
                    <View style={styles.activeBadge}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </View>
                  {reward.rewards.description && (
                    <Text style={styles.rewardDescription}>
                      {reward.rewards.description}
                    </Text>
                  )}
                  {reward.rewards.reward_value && (
                    <Text style={styles.rewardValue}>
                      Valeur: {reward.rewards.reward_value.toLocaleString()} FCFA
                    </Text>
                  )}
                  {reward.expires_at && (
                    <View style={styles.expiryInfo}>
                      <Clock size={14} color="#F59E0B" />
                      <Text style={styles.expiryText}>
                        Expire le {new Date(reward.expires_at).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.rewardPoints}>
                  <Coins size={16} color="#6B7280" />
                  <Text style={styles.rewardPointsText}>
                    {reward.points_spent}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Parrainages */}
        {referrals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={24} color="#10B981" />
              <Text style={styles.sectionTitle}>Vos Parrainages</Text>
            </View>

            <View style={styles.referralsSummary}>
              <View style={styles.referralStat}>
                <Text style={styles.referralNumber}>{activeReferrals}</Text>
                <Text style={styles.referralLabel}>Actifs (+200pts chacun)</Text>
              </View>
              {pendingReferrals > 0 && (
                <View style={styles.referralStat}>
                  <Text style={[styles.referralNumber, { color: '#F59E0B' }]}>
                    {pendingReferrals}
                  </Text>
                  <Text style={styles.referralLabel}>En attente</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/referral')}
            >
              <Text style={styles.viewAllButtonText}>Voir tous les parrainages</Text>
              <ArrowRight size={18} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Historique récent */}
        {usedRewards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={24} color="#6B7280" />
              <Text style={styles.sectionTitle}>Avantages Utilisés</Text>
            </View>

            {usedRewards.slice(0, 3).map((reward) => (
              <View key={reward.id} style={styles.usedRewardCard}>
                <CheckCircle size={20} color="#10B981" />
                <View style={styles.usedRewardContent}>
                  <Text style={styles.usedRewardTitle}>{reward.rewards.title}</Text>
                  <Text style={styles.usedRewardDate}>
                    {new Date(reward.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text style={styles.usedRewardPoints}>
                  -{reward.points_spent} pts
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Comment gagner plus de points */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={24} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Gagnez Plus de Points</Text>
          </View>

          <View style={styles.earningMethods}>
            {EARNING_METHODS.map((method, index) => {
              const Icon = method.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.earningCard}
                  onPress={() => handleActionPress(method.action)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.earningIcon, { backgroundColor: method.color + '15' }]}>
                    <Icon size={24} color={method.color} />
                  </View>
                  <View style={styles.earningContent}>
                    <Text style={styles.earningTitle}>{method.title}</Text>
                    <Text style={[styles.earningPoints, { color: method.color }]}>
                      {method.points}
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#D1D5DB" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CTA vers la boutique de récompenses */}
        <TouchableOpacity
          style={styles.shopCTA}
          onPress={() => router.push('/rewards/shop')}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shopCTAGradient}
          >
            <Gift size={24} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.shopCTAText}>
              Échanger mes {currentPoints.toLocaleString()} points
            </Text>
            <ArrowRight size={24} color="#FFFFFF" />
          </LinearGradient>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Hero Section
  heroSection: {
    padding: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  levelEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  levelName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pointsAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pointsLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  // Progress Section
  progressSection: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  progressPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Tip Section - Style Shopify Premium
  tipContainer: {
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  tipGradient: {
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  tipCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  decorativeCircle1: {
    top: -40,
    right: -40,
  },
  decorativeCircle2: {
    bottom: -50,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  tipMainContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  tipIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.6,
  },
  tipIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipContent: {
    flex: 1,
    gap: 10,
  },
  tipHeader: {
    marginBottom: 4,
  },
  tipBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 1,
  },
  tipBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  tipTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  tipDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    fontWeight: '500',
  },
  tipActionWrapper: {
    marginTop: 4,
  },
  tipAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tipActionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  tipActionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
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
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Section
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  // Reward Card
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardContent: {
    flex: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  rewardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 8,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  rewardPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardPointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Referrals
  referralsSummary: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  referralStat: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  referralNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  referralLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },

  // Used Rewards
  usedRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  usedRewardContent: {
    flex: 1,
  },
  usedRewardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  usedRewardDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  usedRewardPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Earning Methods
  earningMethods: {
    gap: 12,
  },
  earningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningContent: {
    flex: 1,
  },
  earningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  earningPoints: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Shop CTA
  shopCTA: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  shopCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  shopCTAText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
