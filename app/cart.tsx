import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingCart, Shield, Trash2, Plus, Minus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';
import CartItemCard from '@/components/cart/CartItemCard';
import CartSummary from '@/components/cart/CartSummary';
import { LinearGradient } from 'expo-linear-gradient';

export default function CartScreen() {
  const router = useRouter();
  const { cartItems, cartCount, loading } = useCart();
  const { isDark } = useTheme();

  // Theme colors
  const themeColors = {
    background: isDark ? '#111827' : Colors.backgroundLight,
    card: isDark ? '#1F2937' : Colors.white,
    text: isDark ? '#F9FAFB' : Colors.textPrimary,
    textSecondary: isDark ? '#D1D5DB' : Colors.textSecondary,
    textMuted: isDark ? '#9CA3AF' : Colors.textMuted,
    border: isDark ? '#374151' : Colors.borderLight,
  };

  if (loading && cartItems.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Chargement du panier...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartCount === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header avec retour */}
        <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Mon Panier</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrapper, { backgroundColor: themeColors.card }]}>
            <ShoppingCart size={80} color={themeColors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Votre panier est vide</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
            Découvrez nos produits et commencez vos achats
          </Text>

          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shopButtonGradient}
            >
              <ShoppingCart size={20} color={Colors.white} />
              <Text style={styles.shopButtonText}>Découvrir les produits</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header amélioré */}
      <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Mon Panier</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>{cartCount}</Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemsContainer}>
          {cartItems.map((item) => (
            <CartItemCard key={item.id} item={item} />
          ))}
        </View>

        <CartSummary showCheckoutButton={true} />

        {/* Badge paiement sécurisé */}
        <View style={[styles.securePayment, { backgroundColor: themeColors.card }]}>
          <Shield size={20} color="#10B981" />
          <Text style={[styles.secureText, { color: themeColors.textSecondary }]}>Paiement 100% sécurisé</Text>
        </View>

        {/* Avantages */}
        <View style={styles.benefitsContainer}>
          <View style={[styles.benefitItem, { backgroundColor: themeColors.card }]}>
            <View style={styles.benefitIcon}>
              <Shield size={18} color={Colors.primaryOrange} />
            </View>
            <Text style={[styles.benefitText, { color: themeColors.textSecondary }]}>
              Garantie 100% sécurisé
            </Text>
          </View>
          <View style={[styles.benefitItem, { backgroundColor: themeColors.card }]}>
            <View style={styles.benefitIcon}>
              <ShoppingCart size={18} color={Colors.primaryOrange} />
            </View>
            <Text style={[styles.benefitText, { color: themeColors.textSecondary }]}>
              Livraison rapide
            </Text>
          </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  itemCountBadge: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shopButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  securePayment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    gap: 8,
  },
  secureText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  benefitsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  benefitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
