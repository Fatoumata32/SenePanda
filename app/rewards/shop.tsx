import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  Gift,
  Coins,
  Truck,
  Tag,
  Percent,
  Lock,
  Unlock,
  Volume2,
  TrendingUp,
  Award,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

type Reward = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  category: 'discount' | 'boost' | 'premium' | 'gift';
  value: number | null;
  duration_days: number | null;
  stock: number | null;
  is_active: boolean;
  icon: string | null;
};

type UserPoints = {
  points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
};

const REWARD_ICONS = {
  discount: Percent,
  boost: TrendingUp,
  premium: Award,
  gift: Gift,
};

export default function RewardsShopScreen() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'discount' | 'boost' | 'premium' | 'gift'>('all');

  useEffect(() => {
    if (user) {
      loadUserPoints();
      loadRewards();
    }
  }, [user]);

  const loadUserPoints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('points, level')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUserPoints(data);
      } else {
        // Créer une entrée par défaut
        const { data: newData } = await supabase
          .from('loyalty_points')
          .insert({
            user_id: user.id,
            points: 0,
            level: 'bronze',
          })
          .select('points, level')
          .single();

        setUserPoints(newData || { points: 0, level: 'bronze' });
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

  const getRewardIcon = (type: string) => {
    return REWARD_ICONS[type as keyof typeof REWARD_ICONS] || Gift;
  };

  const speakReward = (reward: Reward) => {
    const type = reward.category === 'discount' ? 'Réduction' :
                 reward.category === 'boost' ? 'Boost de visibilité' :
                 reward.category === 'premium' ? 'Avantage premium' : 'Cadeau';

    const value = reward.value ? `de ${reward.value} francs CFA` : '';

    Speech.speak(
      `${reward.title}. ${type} ${value}. Coût: ${reward.points_cost} points`,
      { language: 'fr-FR', rate: 0.85 }
    );
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!user || !userPoints) return;

    if (!canAfford(reward)) {
      Alert.alert(
        '💰 Points insuffisants',
        `Il vous manque ${reward.points_cost - userPoints.points} points pour obtenir cette récompense.`
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
    : rewards.filter(r => r.category === filter);

  const renderReward = ({ item }: { item: Reward }) => {
    const Icon = getRewardIcon(item.category);
    const affordable = canAfford(item);
    const available = affordable;
    const outOfStock = item.stock !== null && item.stock <= 0;

    return (
      <TouchableOpacity
        style={[styles.rewardCard, !available && styles.rewardCardLocked]}
        onPress={() => available && !outOfStock ? handleClaimReward(item) : null}
        disabled={!available || outOfStock}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={available ? ['#FFFFFF', '#FFF7ED'] : ['#F9FAFB', '#F3F4F6']}
          style={styles.rewardContent}
        >
          {/* Icon et Badge de status */}
          <View style={styles.rewardHeader}>
            <View style={[
              styles.rewardIconCircle,
              { backgroundColor: available ? '#FEF3C7' : '#E5E7EB' }
            ]}>
              <Icon size={32} color={available ? '#F59E0B' : '#9CA3AF'} strokeWidth={2} />
            </View>
            {outOfStock && (
              <View style={styles.stockBadge}>
                <Text style={styles.stockBadgeText}>Épuisé</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <Text style={[styles.rewardTitle, !available && styles.rewardTitleLocked]}>
            {String(item.title)}
          </Text>
          <Text style={styles.rewardDescription} numberOfLines={2}>
            {item.description ? String(item.description) : 'Aucune description'}
          </Text>

          {/* Valeur */}
          {item.value && (
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>
                {`${String(item.value.toLocaleString())} FCFA`}
              </Text>
            </View>
          )}

          {/* Prix en points */}
          <View style={styles.rewardFooter}>
            <View style={[
              styles.pointsBadge,
              { backgroundColor: affordable ? '#FEF3C7' : '#FEE2E2' }
            ]}>
              <Coins size={18} color={affordable ? '#F59E0B' : '#EF4444'} />
              <Text style={[
                styles.pointsText,
                { color: affordable ? '#F59E0B' : '#EF4444' }
              ]}>
                {String(item.points_cost.toLocaleString())}
              </Text>
            </View>

            {/* Bouton audio */}
            <TouchableOpacity
              style={styles.speakButton}
              onPress={(e) => {
                e.stopPropagation();
                speakReward(item);
              }}
            >
              <Volume2 size={20} color="#F59E0B" />
            </TouchableOpacity>
          </View>

          {/* Stock restant */}
          {item.stock !== null && item.stock > 0 && item.stock <= 10 && (
            <Text style={styles.stockWarning}>
              Plus que {String(item.stock)} disponible{item.stock > 1 ? 's' : ''}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Boutique Récompenses',
          headerShown: true,
        }}
      />

      {/* Header avec solde */}
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <Coins size={32} color="#FFFFFF" strokeWidth={2.5} />
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Votre solde</Text>
          <Text style={styles.balanceAmount}>
            {userPoints?.points.toLocaleString() || '0'} Panda Coins
          </Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{userPoints?.level || 'bronze'}</Text>
        </View>
      </LinearGradient>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            🛍️ Tout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'discount' && styles.filterChipActive]}
          onPress={() => setFilter('discount')}
        >
          <Text style={[styles.filterText, filter === 'discount' && styles.filterTextActive]}>
            💸 Réductions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'boost' && styles.filterChipActive]}
          onPress={() => setFilter('boost')}
        >
          <Text style={[styles.filterText, filter === 'boost' && styles.filterTextActive]}>
            🚀 Boosts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'premium' && styles.filterChipActive]}
          onPress={() => setFilter('premium')}
        >
          <Text style={[styles.filterText, filter === 'premium' && styles.filterTextActive]}>
            👑 Premium
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des récompenses */}
      <FlatList
        data={filteredRewards}
        renderItem={renderReward}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.rewardsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Gift size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucune récompense disponible</Text>
          </View>
        }
      />
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
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#D97706',
  },
  rewardsList: {
    padding: 8,
  },
  rewardCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rewardCardLocked: {
    opacity: 0.6,
  },
  rewardContent: {
    padding: 16,
  },
  rewardHeader: {
    position: 'relative',
    marginBottom: 12,
  },
  rewardIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stockBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  rewardTitleLocked: {
    color: '#9CA3AF',
  },
  rewardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  valueContainer: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
  },
  speakButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockWarning: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
