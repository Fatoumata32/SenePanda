import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Gift,
  ShoppingBag,
  Users,
  Award,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';

type TransactionType = 'earn' | 'spend' | 'referral' | 'bonus' | 'purchase' | 'reward';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
}

interface WalletStats {
  totalEarned: number;
  totalSpent: number;
  referralEarnings: number;
  pendingRewards: number;
}

export default function WalletScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<WalletStats>({
    totalEarned: 0,
    totalSpent: 0,
    referralEarnings: 0,
    pendingRewards: 0,
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.replace('/simple-auth');
        return;
      }

      setUser(authUser);

      // Charger le solde
      const { data: profile } = await supabase
        .from('profiles')
        .select('pandacoins_balance')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        setBalance(profile.pandacoins_balance || 0);
      }

      // Charger les transactions
      const { data: txData, error: txError } = await supabase
        .from('pandacoins_transactions')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!txError && txData) {
        const mappedTransactions: Transaction[] = txData.map(tx => ({
          id: tx.id,
          type: tx.transaction_type as TransactionType,
          amount: tx.amount,
          description: tx.description || getDefaultDescription(tx.transaction_type, tx.amount),
          created_at: tx.created_at,
          status: 'completed',
        }));
        setTransactions(mappedTransactions);

        // Calculer les stats
        const earned = txData
          .filter(tx => tx.amount > 0)
          .reduce((sum, tx) => sum + tx.amount, 0);

        const spent = txData
          .filter(tx => tx.amount < 0)
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        const referrals = txData
          .filter(tx => tx.transaction_type === 'referral')
          .reduce((sum, tx) => sum + tx.amount, 0);

        setStats({
          totalEarned: earned,
          totalSpent: spent,
          referralEarnings: referrals,
          pendingRewards: 0,
        });
      } else {
        // Pas de transactions, créer des données de démo
        setTransactions(getDemoTransactions());
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultDescription = (type: string, amount: number): string => {
    const absAmount = Math.abs(amount);
    switch (type) {
      case 'purchase':
        return `Achat effectué - ${absAmount} PC`;
      case 'referral':
        return `Bonus de parrainage + ${absAmount} PC`;
      case 'reward':
        return `Récompense gagnée + ${absAmount} PC`;
      case 'bonus':
        return `Bonus quotidien + ${absAmount} PC`;
      default:
        return amount > 0 ? `+ ${absAmount} PandaCoins` : `- ${absAmount} PandaCoins`;
    }
  };

  const getDemoTransactions = (): Transaction[] => [
    {
      id: '1',
      type: 'referral',
      amount: 100,
      description: 'Bonus de parrainage',
      created_at: new Date().toISOString(),
      status: 'completed',
    },
    {
      id: '2',
      type: 'purchase',
      amount: -50,
      description: 'Achat de produit',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed',
    },
    {
      id: '3',
      type: 'bonus',
      amount: 25,
      description: 'Bonus quotidien',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const getTransactionIcon = (type: TransactionType) => {
    const iconProps = { size: 20, color: Colors.white };
    switch (type) {
      case 'earn':
      case 'bonus':
        return <Plus {...iconProps} />;
      case 'spend':
      case 'purchase':
        return <ShoppingBag {...iconProps} />;
      case 'referral':
        return <Users {...iconProps} />;
      case 'reward':
        return <Gift {...iconProps} />;
      default:
        return <Wallet {...iconProps} />;
    }
  };

  const getTransactionColor = (type: TransactionType): string => {
    switch (type) {
      case 'earn':
      case 'bonus':
      case 'referral':
      case 'reward':
        return '#10B981';
      case 'spend':
      case 'purchase':
        return '#EF4444';
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) }]}>
        {getTransactionIcon(item.type)}
      </View>

      <View style={styles.transactionContent}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
      </View>

      <Text
        style={[
          styles.transactionAmount,
          { color: item.amount > 0 ? '#10B981' : '#EF4444' },
        ]}>
        {item.amount > 0 ? '+' : ''}{item.amount} PC
      </Text>
    </View>
  );

  const earnOptions = [
    {
      id: 'referral',
      title: 'Parrainer',
      subtitle: '+100 PC par ami',
      icon: Users,
      color: Colors.primaryOrange,
      route: '/referral',
    },
    {
      id: 'rewards',
      title: 'Récompenses',
      subtitle: 'Gagner des points',
      icon: Gift,
      color: Colors.primaryGold,
      route: '/rewards',
    },
    {
      id: 'shop',
      title: 'Acheter',
      subtitle: 'Points fidélité',
      icon: ShoppingBag,
      color: '#3B82F6',
      route: '/(tabs)/explore',
    },
    {
      id: 'surveys',
      title: 'Sondages',
      subtitle: '+10 PC par réponse',
      icon: Award,
      color: '#8B5CF6',
      route: '/surveys',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Portefeuille</Text>
        </View>

        {/* Carte de solde */}
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF8C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Wallet size={32} color={Colors.white} />
            <Text style={styles.balanceLabel}>Solde disponible</Text>
          </View>
          <Text style={styles.balanceAmount}>{balance.toLocaleString()} PC</Text>
          <Text style={styles.balanceSubtitle}>PandaCoins</Text>

          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.balanceButton}
              onPress={() => Speech.speak('Retrait bientôt disponible', { language: 'fr-FR' })}>
              <ArrowUpRight size={18} color={Colors.primaryOrange} />
              <Text style={styles.balanceButtonText}>Retirer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.balanceButton}
              onPress={() => router.push('/rewards/shop' as any)}>
              <Gift size={18} color={Colors.primaryOrange} />
              <Text style={styles.balanceButtonText}>Échanger</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.totalEarned.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Gagnés</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingDown size={24} color="#EF4444" />
            <Text style={styles.statValue}>{stats.totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Dépensés</Text>
          </View>

          <View style={styles.statCard}>
            <Users size={24} color={Colors.primaryOrange} />
            <Text style={styles.statValue}>{stats.referralEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Parrainages</Text>
          </View>
        </View>

        {/* Options pour gagner des points */}
        <View style={styles.earnSection}>
          <Text style={styles.sectionTitle}>Gagner des PandaCoins</Text>
          <View style={styles.earnGrid}>
            {earnOptions.map(option => {
              const Icon = option.icon;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={styles.earnCard}
                  onPress={() => router.push(option.route as any)}
                  activeOpacity={0.7}>
                  <View style={[styles.earnIcon, { backgroundColor: `${option.color}20` }]}>
                    <Icon size={24} color={option.color} />
                  </View>
                  <Text style={styles.earnTitle}>{option.title}</Text>
                  <Text style={styles.earnSubtitle}>{option.subtitle}</Text>
                  <ArrowRight size={16} color={Colors.textMuted} style={styles.earnArrow} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Historique des transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Historique</Text>
            <TouchableOpacity onPress={() => router.push('/wallet/history' as any)}>
              <Text style={styles.viewAllText}>Tout voir</Text>
            </TouchableOpacity>
          </View>

          {transactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 5).map(transaction => (
                <View key={transaction.id}>{renderTransaction({ item: transaction })}</View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTransactions}>
              <Wallet size={60} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Aucune transaction</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  balanceCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.lg,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  balanceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  balanceButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryOrange,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.small,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  earnSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  earnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  earnCard: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    position: 'relative',
    ...Shadows.small,
  },
  earnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  earnTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  earnSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  earnArrow: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  transactionsSection: {
    marginBottom: Spacing.xl,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryOrange,
    fontWeight: Typography.fontWeight.semibold,
  },
  transactionsList: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
});
