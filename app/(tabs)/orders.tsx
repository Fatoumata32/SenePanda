/**
 * Écran de liste des commandes de l'utilisateur
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Package, MapPin, Calendar, ArrowLeft } from 'lucide-react-native';
import { useOrders, Order } from '../../hooks/useOrders';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loading, cancelOrder } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      'Annuler la commande',
      'Êtes-vous sûr de vouloir annuler cette commande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelOrder(orderId);
            if (success) {
              Alert.alert('Succès', 'Commande annulée avec succès');
            } else {
              Alert.alert('Erreur', 'Impossible d\'annuler cette commande');
            }
          },
        },
      ]
    );
  };

  const renderOrder = ({ item }: { item: Order }) => {
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/orders/${item.id}` as any)}
      >
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

        {item.shipping_address && (
          <View style={styles.addressInfo}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.infoText}>{item.shipping_address}</Text>
          </View>
        )}

        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Produits</Text>
          {item.items?.map((orderItem: any, index: number) => (
            <View key={index} style={styles.orderItem}>
              <Package size={16} color="#6B7280" />
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.product?.title || 'Produit'}
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
            {item.total_amount.toLocaleString()} FCFA
          </Text>
        </View>

        {(item.status === 'pending' || item.status === 'confirmed') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelOrder(item.id)}>
            <Text style={styles.cancelButtonText}>Annuler la commande</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
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
        <TouchableOpacity onPress={() => {
          router.replace('/(tabs)/profile');
        }} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Mes Achats</Text>
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
              ? "Vous n'avez pas encore passé de commande"
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    minHeight: 36,
    justifyContent: 'center',
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
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
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
  actionButton: {
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
