import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'expo-router';

interface CartSummaryProps {
  showCheckoutButton?: boolean;
}

export default function CartSummary({ showCheckoutButton = true }: CartSummaryProps) {
  const { cartCount, cartTotal } = useCart();
  const router = useRouter();

  const shippingCost = cartTotal > 25000 ? 0 : 2500;
  const tax = cartTotal * 0.1; // 10% tax
  const total = cartTotal + shippingCost + tax;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Résumé de la commande</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Sous-total ({cartCount} articles)</Text>
        <Text style={styles.value}>{cartTotal.toLocaleString()} FCFA</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Livraison</Text>
        <Text style={[styles.value, shippingCost === 0 && styles.free]}>
          {shippingCost === 0 ? 'GRATUIT' : `${shippingCost.toLocaleString()} FCFA`}
        </Text>
      </View>

      {cartTotal > 0 && cartTotal < 25000 && (
        <Text style={styles.freeShippingNote}>
          Plus que {(25000 - cartTotal).toLocaleString()} FCFA pour la livraison gratuite!
        </Text>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Taxes (10%)</Text>
        <Text style={styles.value}>{Math.round(tax).toLocaleString()} FCFA</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{Math.round(total).toLocaleString()} FCFA</Text>
      </View>

      {showCheckoutButton && cartCount > 0 && (
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutButtonText}>
            Passer la commande
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  free: {
    color: Colors.successGreen,
    fontWeight: '700',
  },
  freeShippingNote: {
    fontSize: 12,
    color: Colors.primaryOrange,
    fontStyle: 'italic',
    marginBottom: 12,
    marginTop: -8,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  checkoutButton: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
