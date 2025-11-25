import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Package, Truck, Percent, Gift } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { formatPrice } from '@/lib/formatters';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  discountCode?: string;
  total: number;
  currency?: string;
  pointsEarned?: number;
}

function OrderSummaryComponent({
  items,
  subtotal,
  shipping,
  discount = 0,
  discountCode,
  total,
  currency = 'FCFA',
  pointsEarned = 0,
}: OrderSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Récapitulatif</Text>

      {/* Items count */}
      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Package size={16} color={Colors.textSecondary} />
          <Text style={styles.label}>
            Articles ({items.reduce((sum, item) => sum + item.quantity, 0)})
          </Text>
        </View>
        <Text style={styles.value}>{formatPrice(subtotal, { currency })}</Text>
      </View>

      {/* Shipping */}
      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Truck size={16} color={Colors.textSecondary} />
          <Text style={styles.label}>Livraison</Text>
        </View>
        <Text style={[styles.value, shipping === 0 && styles.freeText]}>
          {shipping === 0 ? 'Gratuite' : formatPrice(shipping, { currency })}
        </Text>
      </View>

      {/* Discount */}
      {discount > 0 && (
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Percent size={16} color={Colors.success} />
            <Text style={[styles.label, styles.discountLabel]}>
              Réduction {discountCode && `(${discountCode})`}
            </Text>
          </View>
          <Text style={styles.discountValue}>
            -{formatPrice(discount, { currency })}
          </Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(total, { currency })}</Text>
      </View>

      {/* Points earned */}
      {pointsEarned > 0 && (
        <View style={styles.pointsRow}>
          <Gift size={14} color={Colors.primaryGold} />
          <Text style={styles.pointsText}>
            +{pointsEarned} points à gagner
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  freeText: {
    color: Colors.success,
  },
  discountLabel: {
    color: Colors.success,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryOrange,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryGold,
  },
});

export const OrderSummary = memo(OrderSummaryComponent);
export default OrderSummary;
