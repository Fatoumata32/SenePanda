import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Package, MapPin, Phone, Calendar } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  product: {
    title: string;
    image_url: string | null;
  };
};

type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  currency: string;
  status: string;
  shipping_address: string;
  user_id: string;
  order_items: OrderItem[];
  profile: {
    full_name: string | null;
    phone: string | null;
  };
};

export default function SellerOrdersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      // First, get all order_items for this seller's products
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products!inner(
            title,
            image_url,
            seller_id
          ),
          order:orders!inner(
            id,
            created_at,
            total_amount,
            currency,
            status,
            shipping_address,
            user_id
          )
        `)
        .eq('product.seller_id', user.id);

      if (itemsError) throw itemsError;

      // Group order items by order_id
      const ordersMap = new Map<string, any>();

      for (const item of orderItems || []) {
        const orderId = item.order.id;

        if (!ordersMap.has(orderId)) {
          // Get profile for this order
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', item.order.user_id)
            .single();

          ordersMap.set(orderId, {
            ...item.order,
            order_items: [],
            profile: profileData || { full_name: null, phone: null },
          });
        }

        ordersMap.get(orderId).order_items.push(item);
      }

      const ordersArray = Array.from(ordersMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(ordersArray);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Confirmation pour l'annulation
    if (newStatus === 'cancelled') {
      Alert.alert(
        'Annuler la commande',
        'Êtes-vous sûr de vouloir annuler cette commande ?',
        [
          { text: 'Non', style: 'cancel' },
          {
            text: 'Oui, annuler',
            style: 'destructive',
            onPress: () => performUpdate(orderId, newStatus),
          },
        ]
      );
      return;
    }

    performUpdate(orderId, newStatus);
  };

  const performUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();

      const messages: { [key: string]: string } = {
        confirmed: 'Commande confirmée avec succès',
        shipped: 'Commande marquée comme expédiée',
        delivered: 'Commande marquée comme livrée',
        cancelled: 'Commande annulée',
      };

      Alert.alert('Succès', messages[newStatus] || 'Statut de commande mis à jour');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le statut');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#3B82F6';
      case 'shipped':
        return '#8B5CF6';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'shipped':
        return 'Expédiée';
      case 'delivered':
        return 'Livrée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter(
    order => selectedStatus === 'all' || order.status === selectedStatus
  );

  const getOrderCountByStatus = (status: string) => {
    if (status === 'all') return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const orderTotal = item.order_items.reduce(
      (sum, orderItem) => sum + orderItem.unit_price * orderItem.quantity,
      0
    );

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{item.id.substring(0, 8)}</Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.orderDate}>
                {new Date(item.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}20` },
            ]}>
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {item.profile?.full_name || 'Client'}
          </Text>
          {item.profile?.phone && (
            <View style={styles.infoRow}>
              <Phone size={14} color="#6B7280" />
              <Text style={styles.infoText}>{item.profile.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.infoText}>{item.shipping_address}</Text>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Produits</Text>
          {item.order_items.map((orderItem) => (
            <View key={orderItem.id} style={styles.orderItem}>
              <Package size={16} color="#6B7280" />
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.product.title}
              </Text>
              <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
              <Text style={styles.itemPrice}>
                {(orderItem.unit_price * orderItem.quantity).toLocaleString()} FCFA
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            {orderTotal.toLocaleString()} FCFA
          </Text>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => updateOrderStatus(item.id, 'confirmed')}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => updateOrderStatus(item.id, 'cancelled')}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.shipButton]}
            onPress={() => updateOrderStatus(item.id, 'shipped')}>
            <Text style={styles.shipButtonText}>Marquer comme expédiée</Text>
          </TouchableOpacity>
        )}

        {item.status === 'shipped' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliverButton]}
            onPress={() => updateOrderStatus(item.id, 'delivered')}>
            <Text style={styles.deliverButtonText}>Marquer comme livrée</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Mes Commandes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}>
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'pending', label: 'En attente' },
          { key: 'confirmed', label: 'Confirmées' },
          { key: 'shipped', label: 'Expédiées' },
          { key: 'delivered', label: 'Livrées' },
        ].map((filter) => {
          const count = getOrderCountByStatus(filter.key);
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedStatus === filter.key && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedStatus(filter.key)}>
              <Text
                style={[
                  styles.filterText,
                  selectedStatus === filter.key && styles.filterTextSelected,
                ]}>
                {filter.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    selectedStatus === filter.key && styles.countBadgeSelected,
                  ]}>
                  <Text
                    style={[
                      styles.countText,
                      selectedStatus === filter.key && styles.countTextSelected,
                    ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Package size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Aucune commande</Text>
          <Text style={styles.emptyText}>
            {selectedStatus === 'all'
              ? "Vous n'avez pas encore reçu de commandes"
              : `Aucune commande ${getStatusLabel(selectedStatus).toLowerCase()}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChipSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextSelected: {
    color: '#D97706',
  },
  countBadge: {
    backgroundColor: '#E5E7EB',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeSelected: {
    backgroundColor: '#D97706',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  countTextSelected: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D97706',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  shipButton: {
    backgroundColor: '#8B5CF6',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shipButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deliverButton: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deliverButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
