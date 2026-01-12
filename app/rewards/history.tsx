import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Coins,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useCoinBalance, COINS_TO_FCFA_RATE } from '@/hooks/useCoinBalance';
import CoinsHistory from '@/components/rewards/CoinsHistory';

export default function CoinsHistoryScreen() {
  const router = useRouter();
  const { balance, refresh, loading: balanceLoading } = useCoinBalance();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalSpent: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get stats from transactions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from('points_transactions')
        .select('points, created_at')
        .eq('user_id', user.id);

      if (transactions) {
        const totalEarned = transactions
          .filter(t => t.points > 0)
          .reduce((sum, t) => sum + t.points, 0);
        
        const totalSpent = transactions
          .filter(t => t.points < 0)
          .reduce((sum, t) => sum + Math.abs(t.points), 0);
        
        const thisMonth = transactions
          .filter(t => new Date(t.created_at) >= startOfMonth && t.points > 0)
          .reduce((sum, t) => sum + t.points, 0);

        setStats({ totalEarned, totalSpent, thisMonth });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadStats()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Panda Coins</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => router.push('/rewards/shop')}
        >
          <Coins size={20} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E91E63']}
          />
        }
      >
        {/* Balance Card */}
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconBg}>
              <Coins size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.balanceLabel}>Solde Actuel</Text>
          </View>
          
          <Text style={styles.balanceValue}>
            {balance?.points.toLocaleString() || 0}
          </Text>
          <Text style={styles.balanceSubtext}>Panda Coins</Text>
          
          <View style={styles.balanceEquiv}>
            <Text style={styles.equivText}>
              ≈ {((balance?.points || 0) * COINS_TO_FCFA_RATE).toLocaleString()} FCFA
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#D1FAE5' }]}>
              <TrendingUp size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.totalEarned.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Gagné</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#FEE2E2' }]}>
              <TrendingDown size={20} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{stats.totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Utilisé</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#E0E7FF' }]}>
              <Calendar size={20} color="#6366F1" />
            </View>
            <Text style={styles.statValue}>{stats.thisMonth.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Ce Mois</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/rewards/shop')}
          >
            <LinearGradient
              colors={['#E91E63', '#C2185B']}
              style={styles.actionIconBg}
            >
              <Coins size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Échanger mes coins</Text>
              <Text style={styles.actionSubtitle}>Réductions, livraison gratuite...</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique des transactions</Text>
          <CoinsHistory />
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Comment gagner plus?</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• 1 coin pour chaque 1000 FCFA d'achat</Text>
            <Text style={styles.tipItem}>• Utilisez vos coins au checkout</Text>
            <Text style={styles.tipItem}>• Échangez contre des récompenses</Text>
            <Text style={styles.tipItem}>• Parrainez vos amis (+50 coins)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  balanceIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 16,
  },
  balanceEquiv: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  equivText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsContainer: {
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
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  historySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  tipsSection: {
    margin: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 22,
  },
});
