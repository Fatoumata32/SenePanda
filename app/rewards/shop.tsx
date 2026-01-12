import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  Gift,
  Coins,
  Truck,
  Percent,
  Volume2,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Zap,
  Crown,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Reward = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  reward_type: 'discount' | 'boost' | 'premium' | 'gift' | 'free_shipping';
  value: number | null;
  duration_days: number | null;
  stock: number | null;
  is_active: boolean;
  icon: string | null;
};

type UserPoints = {
  points: number;
  total_earned: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
};

const REWARD_CONFIG = {
  discount: {
    icon: Percent,
    gradient: ['#EC4899', '#F472B6'] as [string, string],
    bgColor: '#FDF2F8',
    label: 'Réduction',
    emoji: '💸',
  },
  boost: {
    icon: Zap,
    gradient: ['#8B5CF6', '#A78BFA'] as [string, string],
    bgColor: '#F5F3FF',
    label: 'Boost',
    emoji: '🚀',
  },
  premium: {
    icon: Crown,
    gradient: ['#F59E0B', '#FBBF24'] as [string, string],
    bgColor: '#FFFBEB',
    label: 'Premium',
    emoji: '👑',
  },
  gift: {
    icon: Gift,
    gradient: ['#10B981', '#34D399'] as [string, string],
    bgColor: '#ECFDF5',
    label: 'Cadeau',
    emoji: '🎁',
  },
  free_shipping: {
    icon: Truck,
    gradient: ['#3B82F6', '#60A5FA'] as [string, string],
    bgColor: '#EFF6FF',
    label: 'Livraison',
    emoji: '🚚',
  },
};

const LEVEL_CONFIG = {
  bronze: { color: '#CD7F32', gradient: ['#CD7F32', '#B87333'] as [string, string], next: 500 },
  silver: { color: '#C0C0C0', gradient: ['#C0C0C0', '#A8A9AD'] as [string, string], next: 2000 },
  gold: { color: '#FFD700', gradient: ['#FFD700', '#FFA500'] as [string, string], next: 5000 },
  platinum: { color: '#E5E4E2', gradient: ['#E5E4E2', '#B0B0B0'] as [string, string], next: null },
};

export default function RewardsShopScreen() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'discount' | 'boost' | 'premium' | 'gift' | 'free_shipping'>('all');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (user) {
      loadUserPoints();
      loadRewards();
    }

    // Animation pulse pour le solde
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [user]);

  const loadUserPoints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('points, total_earned, level')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUserPoints(data);
      } else {
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

        setUserPoints(newData || { points: 0, total_earned: 0, level: 'bronze' });
      }
    } catch (error) {
      console.error('Error loading user points:', error);
    }
  };

  const loadRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost');

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAfford = (reward: Reward) => {
    if (!userPoints) return false;
    return userPoints.points >= reward.points_cost;
  };

  const getRewardConfig = (type: string) => {
    return REWARD_CONFIG[type as keyof typeof REWARD_CONFIG] || REWARD_CONFIG.gift;
  };

  const speakReward = (reward: Reward) => {
    const config = getRewardConfig(reward.reward_type);
    const value = reward.value ? `de ${reward.value} francs CFA` : '';

    Speech.speak(
      `${reward.title}. ${config.label} ${value}. Coût: ${reward.points_cost} points`,
      { language: 'fr-FR', rate: 0.85 }
    );
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!user || !userPoints) return;

    if (!canAfford(reward)) {
      Alert.alert(
        '💰 Points insuffisants',
        `Il vous manque ${reward.points_cost - userPoints.points} PandaCoins pour obtenir cette récompense.\n\nContinuez vos achats pour gagner plus de coins !`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Voir mes achats', onPress: () => router.push('/(tabs)/orders') },
        ]
      );
      return;
    }

    if (reward.stock !== null && reward.stock <= 0) {
      Alert.alert('❌ Rupture de stock', 'Cette récompense n\'est plus disponible.');
      return;
    }

    router.push(`/rewards/redeem/${reward.id}`);
  };

  const filteredRewards = filter === 'all'
    ? rewards
    : rewards.filter(r => r.reward_type === filter);

  const getLevelProgress = () => {
    if (!userPoints) return 0;
    const config = LEVEL_CONFIG[userPoints.level];
    if (!config.next) return 100;
    const previousThreshold = userPoints.level === 'bronze' ? 0 :
                              userPoints.level === 'silver' ? 500 :
                              userPoints.level === 'gold' ? 2000 : 5000;
    const progress = ((userPoints.total_earned - previousThreshold) / (config.next - previousThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Background avec pattern */}
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.headerGradient}
      >
        {/* Decorative circles */}
        <View style={[styles.decorCircle, styles.decorCircle1]} />
        <View style={[styles.decorCircle, styles.decorCircle2]} />
        <View style={[styles.decorCircle, styles.decorCircle3]} />

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/profile');
              }
            }}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🎁 Boutique Récompenses</Text>
          <TouchableOpacity 
            style={styles.historyBtn}
            onPress={() => router.push('/rewards/history')}
          >
            <Clock size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Solde Card */}
        <Animated.View style={[styles.balanceCard, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceIconContainer}>
              <View style={styles.coinIcon}>
                <Coins size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Sparkles size={16} color="#FEF3C7" style={styles.sparkle1} />
              <Sparkles size={12} color="#FEF3C7" style={styles.sparkle2} />
            </View>

            <View style={styles.balanceContent}>
              <Text style={styles.balanceLabel}>Votre solde PandaCoins</Text>
              <Text style={styles.balanceAmount}>
                {userPoints?.points?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.balanceEquiv}>
                ≈ {((userPoints?.points || 0) * 5).toLocaleString()} FCFA
              </Text>
            </View>

            {/* Level Badge */}
            <View style={styles.levelContainer}>
              <LinearGradient
                colors={LEVEL_CONFIG[userPoints?.level || 'bronze'].gradient}
                style={styles.levelBadge}
              >
                <Crown size={14} color="#FFFFFF" />
                <Text style={styles.levelText}>
                  {(userPoints?.level || 'bronze').toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
          </LinearGradient>

          {/* Progress bar vers niveau suivant */}
          {userPoints?.level !== 'platinum' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getLevelProgress()}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {Math.max(0, (LEVEL_CONFIG[userPoints?.level || 'bronze'].next || 0) - (userPoints?.total_earned || 0))} pts vers {
                  userPoints?.level === 'bronze' ? 'Silver' :
                  userPoints?.level === 'silver' ? 'Gold' : 'Platinum'
                }
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Stats rapides */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <TrendingUp size={18} color="#10B981" />
            <Text style={styles.statValue}>{userPoints?.total_earned?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Gagnés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ShoppingBag size={18} color="#EC4899" />
            <Text style={styles.statValue}>{((userPoints?.total_earned || 0) - (userPoints?.points || 0)).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Dépensés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Gift size={18} color="#8B5CF6" />
            <Text style={styles.statValue}>{rewards.length}</Text>
            <Text style={styles.statLabel}>Récompenses</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersSection}>
      <Text style={styles.sectionTitle}>Catégories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={styles.filterEmoji}>✨</Text>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tout
          </Text>
          <View style={[styles.filterCount, filter === 'all' && styles.filterCountActive]}>
            <Text style={[styles.filterCountText, filter === 'all' && styles.filterCountTextActive]}>
              {rewards.length}
            </Text>
          </View>
        </TouchableOpacity>

        {Object.entries(REWARD_CONFIG).map(([key, config]) => {
          const count = rewards.filter(r => r.reward_type === key).length;
          if (count === 0) return null;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, filter === key && styles.filterChipActive]}
              onPress={() => setFilter(key as any)}
            >
              <Text style={styles.filterEmoji}>{config.emoji}</Text>
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
                {config.label}
              </Text>
              <View style={[styles.filterCount, filter === key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, filter === key && styles.filterCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderReward = ({ item, index }: { item: Reward; index: number }) => {
    const config = getRewardConfig(item.reward_type);
    const Icon = config.icon;
    const affordable = canAfford(item);
    const outOfStock = item.stock !== null && item.stock <= 0;
    const isDisabled = !affordable || outOfStock;

    return (
      <TouchableOpacity
        style={[
          styles.rewardCard,
          index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 },
          isDisabled && styles.rewardCardDisabled,
        ]}
        onPress={() => !isDisabled && handleClaimReward(item)}
        disabled={isDisabled}
        activeOpacity={0.85}
      >
        {/* Header avec gradient */}
        <LinearGradient
          colors={affordable ? config.gradient : ['#9CA3AF', '#6B7280']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rewardHeader}
        >
          <View style={styles.rewardIconBg}>
            <Icon size={28} color="#FFFFFF" strokeWidth={2} />
          </View>
          
          {/* Badge status */}
          {outOfStock ? (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Épuisé</Text>
            </View>
          ) : item.stock && item.stock <= 5 ? (
            <View style={styles.limitedBadge}>
              <Text style={styles.limitedText}>Plus que {item.stock}!</Text>
            </View>
          ) : null}

          {/* Audio button */}
          <TouchableOpacity
            style={styles.audioBtn}
            onPress={(e) => {
              e.stopPropagation();
              speakReward(item);
            }}
          >
            <Volume2 size={16} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Content */}
        <View style={styles.rewardContent}>
          <Text style={[styles.rewardTitle, isDisabled && styles.rewardTitleDisabled]} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={styles.rewardDesc} numberOfLines={2}>
            {item.description || 'Récompense spéciale'}
          </Text>

          {/* Valeur */}
          {item.value && (
            <View style={[styles.valueTag, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.valueText, { color: config.gradient[0] }]}>
                {item.value >= 100 
                  ? `${item.value.toLocaleString()} FCFA` 
                  : `${item.value}%`
                }
              </Text>
            </View>
          )}

          {/* Prix */}
          <View style={styles.rewardFooter}>
            <View style={[
              styles.priceBadge,
              affordable ? styles.priceBadgeAffordable : styles.priceBadgeExpensive
            ]}>
              <Coins size={16} color={affordable ? '#D97706' : '#EF4444'} />
              <Text style={[
                styles.priceText,
                { color: affordable ? '#D97706' : '#EF4444' }
              ]}>
                {item.points_cost.toLocaleString()}
              </Text>
            </View>

            {affordable && !outOfStock && (
              <View style={styles.claimIndicator}>
                <CheckCircle size={16} color="#10B981" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Gift size={64} color="#F59E0B" />
          </Animated.View>
          <Text style={styles.loadingText}>Chargement des récompenses...</Text>
          <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={filteredRewards}
        renderItem={renderReward}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.rewardsList}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderFilters()}
            <Text style={styles.rewardsTitle}>
              {filter === 'all' ? 'Toutes les récompenses' : `${getRewardConfig(filter).label}s`}
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Gift size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Aucune récompense</Text>
            <Text style={styles.emptyText}>
              {filter !== 'all' 
                ? 'Aucune récompense dans cette catégorie'
                : 'Les récompenses arrivent bientôt !'
              }
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Header
  headerContainer: {
    marginBottom: 8,
  },
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  decorCircle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  decorCircle2: {
    width: 150,
    height: 150,
    bottom: 50,
    left: -75,
  },
  decorCircle3: {
    width: 100,
    height: 100,
    top: 100,
    right: 50,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  balanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  balanceIconContainer: {
    position: 'relative',
  },
  coinIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle1: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 0,
    left: -2,
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 2,
  },
  balanceEquiv: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  levelContainer: {
    alignSelf: 'flex-start',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  progressContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    textAlign: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  },

  // Filters
  filtersSection: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#D97706',
  },
  filterCount: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterCountActive: {
    backgroundColor: '#F59E0B',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },

  // Rewards List
  rewardsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  rewardsList: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  rewardCardDisabled: {
    opacity: 0.7,
  },
  rewardHeader: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rewardIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  limitedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  limitedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  audioBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardContent: {
    padding: 14,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  rewardTitleDisabled: {
    color: '#9CA3AF',
  },
  rewardDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 10,
  },
  valueTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '800',
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priceBadgeAffordable: {
    backgroundColor: '#FEF3C7',
  },
  priceBadgeExpensive: {
    backgroundColor: '#FEE2E2',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  claimIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
