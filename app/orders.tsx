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
import { ArrowLeft, Package, MapPin, Calendar, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number | null;
  price: number | null;
  product: {
    title: string;
    image_url: string | null;
  } | null;
};

type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  order_items: OrderItem[];
};

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Theme colors
  const themeColors = {
    background: isDark ? '#111827' : '#F9FAFB',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    textMuted: isDark ? '#9CA3AF' : '#9CA3AF',
    border: isDark ? '#374151' : '#E5E7EB',
  };

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

      // D'abord récupérer les commandes
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Ensuite récupérer les order_items pour chaque commande
      const orderIds = ordersData.map(o => o.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(
            title,
            image_url
          )
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.warn('Error loading order items:', itemsError);
        // Continuer sans les items si erreur
        setOrders(ordersData.map(order => ({ ...order, order_items: [] })));
        return;
      }

      // Combiner les données
      const ordersWithItems = ordersData.map(order => ({
        ...order,
        order_items: (itemsData || []).filter(item => item.order_id === order.id)
      }));

      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color={getStatusColor(status)} />;
      case 'confirmed':
      case 'shipped':
      case 'delivered':
        return <Package size={16} color={getStatusColor(status)} />;
      default:
        return <Package size={16} color={getStatusColor(status)} />;
    }
  };

  const filteredOrders = orders.filter(
    order => selectedStatus === 'all' || order.status === selectedStatus
  );

  const renderOrder = ({ item }: { item: Order }) => {
    return (
      <View style={[styles.orderCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={[styles.orderId, { color: themeColors.text }]}>Commande #{item.id.substring(0, 8)}</Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color={themeColors.textSecondary} />
              <Text style={[styles.orderDate, { color: themeColors.textSecondary }]}>
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
            <View style={styles.statusContent}>
              {getStatusIcon(item.status)}
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.addressSection}>
          <View style={styles.addressRow}>
            <MapPin size={14} color={themeColors.textSecondary} />
            <Text style={[styles.addressText, { color: themeColors.textSecondary }]}>{item.shipping_address}</Text>
          </View>
        </View>

        <View style={[styles.itemsSection, { borderTopColor: themeColors.border, borderBottomColor: themeColors.border }]}>
          <Text style={[styles.itemsTitle, { color: themeColors.text }]}>
            {item.order_items.length} article{item.order_items.length > 1 ? 's' : ''}
          </Text>
          {item.order_items.map((orderItem) => (
            <View key={orderItem.id} style={styles.orderItem}>
              <Package size={16} color={themeColors.textSecondary} />
              <Text style={[styles.itemName, { color: themeColors.text }]} numberOfLines={1}>
                {orderItem.product?.title || 'Produit'}
              </Text>
              <Text style={[styles.itemQuantity, { color: themeColors.textSecondary }]}>x{orderItem.quantity}</Text>
              <Text style={[styles.itemPrice, { color: themeColors.text }]}>
                {(((orderItem.unit_price || orderItem.price || 0) * orderItem.quantity)).toLocaleString()} FCFA
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Total</Text>
          <Text style={styles.totalAmount}>
            {item.total_amount.toLocaleString()} FCFA
          </Text>
        </View>

        {item.status === 'pending' && (
          <View style={styles.pendingNote}>
            <Clock size={16} color="#F59E0B" />
            <Text style={styles.pendingText}>
              En attente de confirmation du vendeur
            </Text>
          </View>
        )}

        {item.status === 'confirmed' && (
          <View style={styles.confirmedNote}>
            <Package size={16} color="#3B82F6" />
            <Text style={styles.confirmedText}>
              Commande confirmée - Préparation en cours
            </Text>
          </View>
        )}

        {item.status === 'shipped' && (
          <View style={styles.shippedNote}>
            <Package size={16} color="#8B5CF6" />
            <Text style={styles.shippedText}>
              En cours de livraison
            </Text>
          </View>
        )}

        {item.status === 'delivered' && (
          <View style={styles.deliveredNote}>
            <Package size={16} color="#10B981" />
            <Text style={styles.deliveredText}>
              Livraison effectuée avec succès
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Mes Commandes</Text>
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
        ].map((filter) => (
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
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Package size={64} color={themeColors.textMuted} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Aucune commande</Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            {selectedStatus === 'all'
              ? "Vous n'avez pas encore passé de commandes"
              : `Aucune commande ${getStatusLabel(selectedStatus).toLowerCase()}`}
          </Text>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shopButton}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/home')}>
              <Text style={styles.shopButtonText}>Découvrir les produits</Text>
            </TouchableOpacity>
          </LinearGradient>
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
    minHeight: 56,
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexShrink: 0,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
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
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addressSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  itemsSection: {
    marginBottom: 12,
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
    marginBottom: 12,
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
  pendingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },
  confirmedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
  },
  confirmedText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
  },
  shippedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDE9FE',
    padding: 12,
    borderRadius: 8,
  },
  shippedText: {
    fontSize: 13,
    color: '#5B21B6',
    flex: 1,
  },
  deliveredNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
  },
  deliveredText: {
    fontSize: 13,
    color: '#065F46',
    flex: 1,
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
    marginBottom: 24,
  },
  shopButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
