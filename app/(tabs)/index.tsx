import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ShoppingCart, Bell, TrendingUp, Sparkles, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import PandaLogo from '@/components/PandaLogo';
import ProductCard from '@/components/ProductCard';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { cartItems } = useCart();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [flashDeals, setFlashDeals] = useState<Product[]>([]);

  const themeColors = useMemo(() => ({
    background: isDark ? '#111827' : '#FAFAFA',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#1F2937',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#374151' : '#E5E7EB',
  }), [isDark]);

  const cartItemCount = useMemo(() => {
    return cartItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
  }, [cartItems]);

  const fetchProducts = useCallback(async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(20);

      if (error) throw error;

      if (products) {
        // Featured products: top rated or newest
        const featured = products
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
          .slice(0, 6);
        setFeaturedProducts(featured);

        // Flash deals: products with discounts
        const deals = products
          .filter(p => p.discount_percentage && p.discount_percentage > 0)
          .slice(0, 6);
        setFlashDeals(deals);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, router]);

  const navigateToCart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/cart');
  }, [router]);

  const navigateToNotifications = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/notifications');
  }, [router]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryOrange}
            colors={[Colors.primaryOrange]}
          />
        }
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={isDark ? ['#1F2937', '#374151'] : ['#FFE5D9', '#FFF5F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <PandaLogo size="small" showText={true} />

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={navigateToNotifications}
                style={[styles.iconButton, { backgroundColor: themeColors.card }]}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Bell size={20} color={themeColors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={navigateToCart}
                style={[styles.iconButton, { backgroundColor: themeColors.card }]}
                accessibilityRole="button"
                accessibilityLabel={`Panier avec ${cartItemCount} articles`}
              >
                <ShoppingCart size={20} color={themeColors.text} />
                {cartItemCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartItemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome message */}
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeText, { color: themeColors.text }]}>
              Bienvenue sur SenePanda
            </Text>
            <Text style={[styles.welcomeSubtext, { color: themeColors.textSecondary }]}>
              Découvrez les meilleures offres du Sénégal
            </Text>
          </View>

          {/* Search bar */}
          <View style={[styles.searchContainer, { backgroundColor: themeColors.card }]}>
            <Search size={20} color={themeColors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Rechercher un produit..."
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Text style={{ color: themeColors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Flash Deals */}
        {flashDeals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={24} color={Colors.primaryOrange} />
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Offres Flash
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/products?filter=deals');
                }}
                style={styles.seeAllButton}
                accessibilityRole="button"
                accessibilityLabel="Voir toutes les offres flash"
              >
                <Text style={styles.seeAllText}>Voir tout</Text>
                <ChevronRight size={16} color={Colors.primaryOrange} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {flashDeals.map((product) => (
                <View key={product.id} style={styles.productCardWrapper}>
                  <ProductCard
                    product={product}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/product/${product.id}`);
                    }}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp size={24} color={Colors.primaryOrange} />
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Produits Populaires
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/products?sort=popular');
                }}
                style={styles.seeAllButton}
                accessibilityRole="button"
                accessibilityLabel="Voir tous les produits populaires"
              >
                <Text style={styles.seeAllText}>Voir tout</Text>
                <ChevronRight size={16} color={Colors.primaryOrange} />
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {featuredProducts.slice(0, 4).map((product) => (
                <View key={product.id} style={styles.gridItem}>
                  <ProductCard
                    product={product}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/product/${product.id}`);
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CTA Banner */}
        <TouchableOpacity
          style={styles.ctaBanner}
          onPress={() => router.push('/seller/setup')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBannerGradient}
          >
            <View>
              <Text style={styles.ctaTitle}>Devenez Vendeur</Text>
              <Text style={styles.ctaSubtitle}>
                Créez votre boutique en quelques minutes
              </Text>
            </View>
            <View style={styles.ctaIcon}>
              <Text style={styles.ctaIconText}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: Colors.primaryOrange,
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  productCardWrapper: {
    width: width * 0.45,
    maxWidth: 200,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  gridItem: {
    width: (width - 48) / 2,
    marginBottom: 8,
  },
  ctaBanner: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIconText: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: '700',
  },
});
