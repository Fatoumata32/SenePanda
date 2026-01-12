/**
 * Écran de détail d'une commande
 * Avec timeline de suivi en temps réel
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react-native';
import { useOrders, Order } from '../../hooks/useOrders';
import { useLogger } from '../../hooks/useLogger';

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Commande reçue' },
  { key: 'confirmed', label: 'Confirmée' },
  { key: 'processing', label: 'En préparation' },
  { key: 'shipped', label: 'Expédiée' },
  { key: 'delivered', label: 'Livrée' },
];

const STATUS_INDEX: Record<Order['status'], number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const log = useLogger('OrderDetailScreen');
  const { getOrderById, cancelOrder } = useOrders();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;

    setLoading(true);
    const orderData = await getOrderById(id);
    setOrder(orderData);
    setLoading(false);

    if (orderData) {
      log.info('Order loaded', { orderId: id, status: orderData.status });
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;

    Alert.alert(
      'Annuler la commande',
      'Êtes-vous sûr de vouloir annuler cette commande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelOrder(order.id);
            if (success) {
              Alert.alert('Succès', 'Commande annulée');
              router.back();
            } else {
              Alert.alert('Erreur', 'Impossible d\'annuler la commande');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={styles.errorText}>Commande introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIndex = STATUS_INDEX[order.status];
  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Commande</Text>
          <Text style={styles.headerSubtitle}>#{order.id.slice(0, 8)}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Timeline */}
        {order.status !== 'cancelled' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suivi de commande</Text>

            <View style={styles.timeline}>
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <View key={step.key} style={styles.timelineStep}>
                    <View style={styles.timelineLeft}>
                      {isCompleted ? (
                        <CheckCircle2 size={24} color="#10B981" />
                      ) : (
                        <Circle size={24} color="#CBD5E1" />
                      )}

                      {index < TIMELINE_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            isCompleted && styles.timelineLineActive,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.timelineRight}>
                      <Text
                        style={[
                          styles.timelineLabel,
                          isCurrent && styles.timelineLabelActive,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.cancelledBanner}>
            <AlertCircle size={24} color="#EF4444" />
            <Text style={styles.cancelledText}>Commande annulée</Text>
          </View>
        )}

        {/* Tracking Number */}
        {order.tracking_number && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Numéro de suivi</Text>
            <View style={styles.trackingBox}>
              <Package size={20} color="#3B82F6" />
              <Text style={styles.trackingText}>{order.tracking_number}</Text>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles</Text>

          {order.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image
                source={{
                  uri:
                    item.product.image_url ||
                    'https://via.placeholder.com/80x80?text=Produit',
                }}
                style={styles.itemImage}
              />

              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.product.title}
                </Text>

                <Text style={styles.itemQuantity}>Quantité: {item.quantity}</Text>

                <Text style={styles.itemPrice}>{formatPrice(item.unit_price)}</Text>
              </View>

              <Text style={styles.itemTotal}>
                {formatPrice(item.unit_price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          <View style={styles.addressBox}>
            <MapPin size={20} color="#64748B" />
            <Text style={styles.addressText}>{order.shipping_address}</Text>
          </View>

          {order.phone && (
            <View style={[styles.addressBox, { marginTop: 12 }]}>
              <Phone size={20} color="#64748B" />
              <Text style={styles.addressText}>{order.phone}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        {/* Total */}
        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatPrice(order.total_amount)}</Text>
          </View>

          <Text style={styles.totalDate}>Commandé le {formatDate(order.created_at)}</Text>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
            <Text style={styles.cancelButtonText}>Annuler la commande</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 4,
    minHeight: 32,
  },
  timelineLineActive: {
    backgroundColor: '#10B981',
  },
  timelineRight: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 15,
    color: '#64748B',
  },
  timelineLabelActive: {
    fontWeight: '600',
    color: '#1E293B',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cancelledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  trackingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  trackingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    flex: 1,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: '#64748B',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
  },
  notesText: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  totalDate: {
    fontSize: 13,
    color: '#64748B',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  errorText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
