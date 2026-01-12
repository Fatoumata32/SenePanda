import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Gift, Percent, Truck, Tag, Clock, Check, ChevronRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';

type ClaimedReward = {
  id: string;
  reward_id: string;
  points_spent: number;
  status: 'active' | 'used' | 'expired';
  claimed_at: string;
  expires_at: string | null;
  used_at: string | null;
  reward: {
    id: string;
    title: string;
    description: string | null;
    category: 'discount' | 'boost' | 'premium' | 'gift' | 'free_shipping';
    value: number | null;
    duration_days: number | null;
  } | null;
};

type MyRewardsListProps = {
  onRewardSelect?: (reward: ClaimedReward) => void;
  showOnlyActive?: boolean;
  compact?: boolean;
};

const REWARD_ICONS = {
  discount: Percent,
  boost: Sparkles,
  premium: Gift,
  gift: Gift,
  free_shipping: Truck,
};

const REWARD_COLORS = {
  discount: '#EF4444',
  boost: '#8B5CF6',
  premium: '#F59E0B',
  gift: '#10B981',
  free_shipping: '#3B82F6',
};

export default function MyRewardsList({
  onRewardSelect,
  showOnlyActive = false,
  compact = false,
}: MyRewardsListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [rewards, setRewards] = useState<ClaimedReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadClaimedRewards();
    }
  }, [user]);

  const loadClaimedRewards = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('claimed_rewards')
        .select(`
          *,
          reward:rewards(id, title, description, category, value, duration_days)
        `)
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false });

      if (showOnlyActive) {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading claimed rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (reward: ClaimedReward) => {
    if (reward.status === 'used') {
      return { color: '#6B7280', text: 'Utilisé', icon: Check };
    }
    if (reward.status === 'expired') {
      return { color: '#EF4444', text: 'Expiré', icon: Clock };
    }
    
    // Check if about to expire
    if (reward.expires_at) {
      const expiresAt = new Date(reward.expires_at);
      const now = new Date();
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 0) {
        return { color: '#EF4444', text: 'Expiré', icon: Clock };
      }
      if (daysLeft <= 3) {
        return { color: '#F59E0B', text: `${daysLeft}j restants`, icon: Clock };
      }
    }
    
    return { color: '#10B981', text: 'Actif', icon: Check };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleUseReward = async (reward: ClaimedReward) => {
    if (reward.status !== 'active') {
      Alert.alert('Récompense non disponible', 'Cette récompense ne peut plus être utilisée.');
      return;
    }

    if (onRewardSelect) {
      onRewardSelect(reward);
    } else {
      Alert.alert(
        'Utiliser cette récompense?',
        `Voulez-vous utiliser "${reward.reward?.title}"?\n\nCette récompense sera appliquée à votre prochaine commande.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Utiliser',
            onPress: () => {
              // Mark as used and redirect to cart/checkout
              router.push('/cart');
            },
          },
        ]
      );
    }
  };

  const renderReward = ({ item }: { item: ClaimedReward }) => {
    if (!item.reward) return null;

    const Icon = REWARD_ICONS[item.reward.category as keyof typeof REWARD_ICONS] || Gift;
    const color = REWARD_COLORS[item.reward.category as keyof typeof REWARD_COLORS] || '#F59E0B';
    const statusBadge = getStatusBadge(item);
    const isActive = item.status === 'active';

    if (compact) {
      return (
        <TouchableOpacity
          style={[styles.compactCard, !isActive && styles.cardDisabled]}
          onPress={() => handleUseReward(item)}
          disabled={!isActive}
        >
          <View style={[styles.compactIcon, { backgroundColor: color + '20' }]}>
            <Icon size={18} color={color} />
          </View>
          <View style={styles.compactContent}>
            <Text style={styles.compactTitle} numberOfLines={1}>{item.reward.title}</Text>
            {item.reward.value && (
              <Text style={[styles.compactValue, { color }]}>
                {item.reward.category === 'discount' ? `-${item.reward.value}%` : 
                 item.reward.category === 'free_shipping' ? 'Livraison gratuite' :
                 `${item.reward.value.toLocaleString()} FCFA`}
              </Text>
            )}
          </View>
          {isActive && <ChevronRight size={16} color="#9CA3AF" />}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.rewardCard, !isActive && styles.cardDisabled]}
        onPress={() => handleUseReward(item)}
        disabled={!isActive}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isActive ? [color + '15', color + '05'] : ['#F3F4F6', '#F9FAFB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rewardGradient}
        >
          <View style={styles.rewardHeader}>
            <View style={[styles.rewardIcon, { backgroundColor: color + '30' }]}>
              <Icon size={28} color={isActive ? color : '#9CA3AF'} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
              <statusBadge.icon size={12} color={statusBadge.color} />
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>

          <Text style={[styles.rewardTitle, !isActive && styles.textDisabled]}>
            {item.reward.title}
          </Text>
          
          {item.reward.description && (
            <Text style={styles.rewardDescription} numberOfLines={2}>
              {item.reward.description}
            </Text>
          )}

          <View style={styles.rewardFooter}>
            <Text style={styles.claimedDate}>
              Obtenu le {formatDate(item.claimed_at)}
            </Text>
            {item.expires_at && isActive && (
              <Text style={styles.expiresDate}>
                Expire le {formatDate(item.expires_at)}
              </Text>
            )}
          </View>

          {isActive && (
            <View style={[styles.useButton, { backgroundColor: color }]}>
              <Text style={styles.useButtonText}>Utiliser</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#F59E0B" />
      </View>
    );
  }

  if (rewards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Gift size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Aucune récompense</Text>
        <Text style={styles.emptySubtitle}>
          Utilisez vos Panda Coins dans la boutique pour obtenir des récompenses!
        </Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => router.push('/rewards/shop')}
        >
          <Text style={styles.shopButtonText}>Voir la boutique →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={rewards}
      renderItem={renderReward}
      keyExtractor={(item) => item.id}
      contentContainerStyle={compact ? styles.compactList : styles.list}
      horizontal={compact}
      showsHorizontalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  compactList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  rewardCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  rewardGradient: {
    padding: 16,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rewardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  textDisabled: {
    color: '#9CA3AF',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  claimedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  expiresDate: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  useButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  compactValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  shopButton: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
});
