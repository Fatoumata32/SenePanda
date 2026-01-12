import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Coins, Gift, TrendingUp, Award, Zap, Star, ShoppingBag, MessageSquare, Users, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type PointsData = {
  points: number;
  total_earned: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
};

type Transaction = {
  id: string;
  points: number;
  type: 'purchase' | 'review' | 'referral' | 'redemption' | 'bonus' | 'welcome';
  description: string | null;
  created_at: string;
};

type Reward = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  category: 'discount' | 'free_shipping' | 'boost' | 'premium' | 'gift';
  value: number | null;
  duration_days: number | null;
  stock: number | null;
  is_active: boolean;
};

const LEVEL_CONFIG = {
  bronze: {
    name: 'Bronze',
    color: '#CD7F32',
    gradient: ['#CD7F32', '#A0522D'],
    icon: '🥉',
    minPoints: 0,
    maxPoints: 999,
  },
  silver: {
    name: 'Argent',
    color: '#C0C0C0',
    gradient: ['#C0C0C0', '#A8A8A8'],
    icon: '🥈',
    minPoints: 1000,
    maxPoints: 4999,
  },
  gold: {
    name: 'Or',
    color: '#FFD700',
    gradient: ['#FFD700', '#FFA500'],
    icon: '🥇',
    minPoints: 5000,
    maxPoints: 14999,
  },
  platinum: {
    name: 'Platine',
    color: '#E5E4E2',
    gradient: ['#E5E4E2', '#B9F2FF'],
    icon: '💎',
    minPoints: 15000,
    maxPoints: Infinity,
  },
};

const EARNING_METHODS = [
  {
    icon: ShoppingBag,
    title: 'Achat de produit',
    points: '1 point par 1000 FCFA',
    color: '#F59E0B',
  },
  {
    icon: MessageSquare,
    title: 'Laisser un avis',
    points: '+50 points',
    color: '#3B82F6',
  },
  {
    icon: Users,
    title: 'Parrainer un ami',
    points: '+200 points',
    color: '#10B981',
  },
  {
    icon: Calendar,
    title: 'Connexion quotidienne',
    points: '+10 points',
    color: '#8B5CF6',
  },
];

export default function RewardsScreen() {
  const { user } = useAuth();
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPointsData();
      loadTransactions();
      loadRewards();
    }
  }, [user]);

  const loadPointsData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPointsData({
          points: data.points || 0,
          total_earned: data.total_earned || 0,
          level: data.level || 'bronze',
        });
      } else {
        // Créer une entrée si elle n'existe pas
        const { data: newData } = await supabase
          .from('loyalty_points')
          .insert({
            user_id: user.id,
            points: 0,
            total_earned: 0,
            level: 'bronze',
          })
          .select()
          .single();

        setPointsData({
          points: 0,
          total_earned: 0,
          level: 'bronze',
        });
      }
    } catch (error) {
      console.error('Error loading points:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .lte('min_level', pointsData?.level || 'bronze')
        .order('points_cost');

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return ShoppingBag;
      case 'review':
        return MessageSquare;
      case 'referral':
        return Users;
      case 'bonus':
        return Gift;
      case 'welcome':
        return Star;
      case 'redemption':
        return Zap;
      default:
        return Coins;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return '#F59E0B';
      case 'review':
        return '#3B82F6';
      case 'referral':
        return '#10B981';
      case 'redemption':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNextLevel = () => {
    if (!pointsData) return null;
    const currentLevel = pointsData.level;
    const levels = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = levels.indexOf(currentLevel);
    if (currentIndex === levels.length - 1) return null;
    return levels[currentIndex + 1] as 'bronze' | 'silver' | 'gold' | 'platinum';
  };

  const getProgressToNextLevel = () => {
    if (!pointsData) return 0;
    const nextLevel = getNextLevel();
    if (!nextLevel) return 100; // Max level

    const currentConfig = LEVEL_CONFIG[pointsData.level];
    const nextConfig = LEVEL_CONFIG[nextLevel];
    const points = pointsData.total_earned;

    const progress =
      ((points - currentConfig.minPoints) /
        (nextConfig.minPoints - currentConfig.minPoints)) *
      100;

    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (!user || !pointsData) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Mes Récompenses' }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Connectez-vous pour voir vos points</Text>
        </View>
      </View>
    );
  }

  const levelConfig = LEVEL_CONFIG[pointsData.level];
  const nextLevel = getNextLevel();
  const progress = getProgressToNextLevel();

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Panda Coins 🪙' }} />

      {/* Points Card */}
      <LinearGradient
        colors={levelConfig.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pointsCard}
      >
        <View style={styles.levelBadge}>
          <Text style={styles.levelIcon}>{levelConfig.icon}</Text>
          <Text style={styles.levelName}>{levelConfig.name}</Text>
        </View>

        <View style={styles.pointsContent}>
          <Coins size={48} color="#FFFFFF" />
          <Text style={styles.pointsAmount}>{pointsData.points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>Panda Coins</Text>
        </View>

        <View style={styles.totalEarned}>
          <TrendingUp size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.totalEarnedText}>
            {pointsData.total_earned.toLocaleString()} gagnés au total
          </Text>
        </View>
      </LinearGradient>

      {/* Progress to Next Level */}
      {nextLevel && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progression vers {LEVEL_CONFIG[nextLevel].name}</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress}%`,
                  backgroundColor: LEVEL_CONFIG[nextLevel].color,
                },
              ]}
            />
          </View>
          <Text style={styles.progressSubtext}>
            Plus que {String(LEVEL_CONFIG[nextLevel].minPoints - pointsData.total_earned)} points !
          </Text>
        </View>
      )}

      {/* How to Earn Points */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comment gagner des points ?</Text>
        <View style={styles.methodsGrid}>
          {EARNING_METHODS.map((method, index) => {
            const Icon = method.icon;
            return (
              <View key={index} style={styles.methodCard}>
                <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                  <Icon size={24} color={method.color} />
                </View>
                <Text style={styles.methodTitle}>{method.title}</Text>
                <Text style={styles.methodPoints}>{method.points}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Available Rewards */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Récompenses disponibles</Text>
          <TouchableOpacity onPress={() => router.push('/rewards/shop')}>
            <Text style={styles.seeAllText}>Tout voir →</Text>
          </TouchableOpacity>
        </View>
        {rewards.length === 0 ? (
          <Text style={styles.noRewardsText}>Aucune récompense disponible pour le moment</Text>
        ) : (
          rewards.slice(0, 3).map((reward) => (
            <TouchableOpacity
              key={reward.id}
              style={styles.rewardCard}
              onPress={() => router.push(`/rewards/redeem/${reward.id}`)}
            >
              <View style={styles.rewardIcon}>
                <Gift size={24} color="#F59E0B" />
              </View>
              <View style={styles.rewardContent}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDescription} numberOfLines={1}>
                  {reward.description}
                </Text>
              </View>
              <View style={styles.rewardCost}>
                <Coins size={16} color="#F59E0B" />
                <Text style={styles.rewardCostText}>{String(reward.points_cost)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique récent</Text>
        {transactions.length === 0 ? (
          <Text style={styles.noTransactionsText}>Aucune transaction pour le moment</Text>
        ) : (
          transactions.slice(0, 10).map((transaction) => {
            const Icon = getTransactionIcon(transaction.type);
            const color = getTransactionColor(transaction.type);
            const isPositive = transaction.points > 0;

            return (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={[styles.transactionIcon, { backgroundColor: color + '20' }]}>
                  <Icon size={18} color={color} />
                </View>
                <View style={styles.transactionContent}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || 'Transaction'}
                  </Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                </View>
                <Text
                  style={[
                    styles.transactionPoints,
                    { color: isPositive ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {isPositive ? '+' : ''}
                  {String(transaction.points)}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  pointsCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  levelIcon: {
    fontSize: 20,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pointsContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  pointsLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  totalEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  totalEarnedText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
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
    fontWeight: '600',
    color: '#111827',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  methodPoints: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '700',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardCostText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  noRewardsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noTransactionsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
});
