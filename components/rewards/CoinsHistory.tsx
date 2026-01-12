import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ShoppingBag, 
  Gift, 
  Star,
  Coins,
  Calendar
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type Transaction = {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
};

type CoinsHistoryProps = {
  maxItems?: number;
};

export default function CoinsHistory({ maxItems }: CoinsHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (maxItems) {
        query = query.limit(maxItems);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const getTransactionIcon = (type: string, points: number) => {
    const isPositive = points > 0;
    const iconColor = isPositive ? '#10B981' : '#EF4444';
    const iconSize = 20;

    switch (type) {
      case 'purchase':
        return <ShoppingBag size={iconSize} color={iconColor} />;
      case 'reward_claim':
        return <Gift size={iconSize} color={iconColor} />;
      case 'checkout_discount':
        return <Coins size={iconSize} color={iconColor} />;
      case 'referral':
        return <Star size={iconSize} color={iconColor} />;
      default:
        return isPositive 
          ? <ArrowDownCircle size={iconSize} color={iconColor} />
          : <ArrowUpCircle size={iconSize} color={iconColor} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Achat';
      case 'reward_claim':
        return 'Récompense';
      case 'checkout_discount':
        return 'Réduction checkout';
      case 'referral':
        return 'Parrainage';
      case 'bonus':
        return 'Bonus';
      default:
        return type;
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isPositive = item.points > 0;

    return (
      <View style={styles.transactionCard}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: isPositive ? '#D1FAE5' : '#FEE2E2' }
        ]}>
          {getTransactionIcon(item.transaction_type, item.points)}
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>
            {getTransactionLabel(item.transaction_type)}
          </Text>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description || 'Transaction'}
          </Text>
        </View>

        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionPoints,
            { color: isPositive ? '#10B981' : '#EF4444' }
          ]}>
            {isPositive ? '+' : ''}{item.points.toLocaleString()}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#E91E63" />
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Calendar size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Aucune transaction</Text>
        <Text style={styles.emptyText}>
          Vos transactions de coins apparaîtront ici
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={renderTransaction}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#E91E63']}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
