import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { formatPrice, formatRelativeTime } from '@/lib/formatters';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer_name: string;
  total: number;
  items_count: number;
  status: OrderStatus;
  created_at: string;
}

interface RecentOrdersProps {
  orders: Order[];
  onViewAll?: () => void;
  onOrderPress?: (orderId: string) => void;
  currency?: string;
  maxItems?: number;
}

const statusConfig: Record<OrderStatus, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: Colors.warning, label: 'En attente' },
  confirmed: { icon: CheckCircle, color: Colors.info, label: 'Confirmée' },
  shipped: { icon: Truck, color: Colors.primaryOrange, label: 'Expédiée' },
  delivered: { icon: CheckCircle, color: Colors.success, label: 'Livrée' },
  cancelled: { icon: XCircle, color: Colors.error, label: 'Annulée' },
};

function RecentOrdersComponent({
  orders,
  onViewAll,
  onOrderPress,
  currency = 'FCFA',
  maxItems = 5,
}: RecentOrdersProps) {
  const displayOrders = orders.slice(0, maxItems);

  const renderOrder = ({ item }: { item: Order }) => {
    const config = statusConfig[item.status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
      <TouchableOpacity
        style={styles.orderItem}
        onPress={() => onOrderPress?.(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.orderLeft}>
          <View style={[styles.statusIcon, { backgroundColor: `${config.color}15` }]}>
            <StatusIcon size={16} color={config.color} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer_name}
            </Text>
            <Text style={styles.orderMeta}>
              {item.items_count} article{item.items_count > 1 ? 's' : ''} • {formatRelativeTime(item.created_at)}
            </Text>
          </View>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.orderTotal}>{formatPrice(item.total, { currency, compact: true })}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${config.color}15` }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Package size={18} color={Colors.text} />
          <Text style={styles.title}>Commandes récentes</Text>
        </View>
        {onViewAll && orders.length > 0 && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Tout voir</Text>
            <ChevronRight size={16} color={Colors.primaryOrange} />
          </TouchableOpacity>
        )}
      </View>

      {displayOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Package size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Aucune commande récente</Text>
        </View>
      ) : (
        <FlatList
          data={displayOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryOrange,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  orderMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});

export const RecentOrders = memo(RecentOrdersComponent);
export default RecentOrders;
