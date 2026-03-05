import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Store, ShoppingBag, Search, Bell, ShoppingCart, Heart } from 'lucide-react-native';
import { getCurrentUser } from '@/lib/auth-helpers';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs
} from '@react-native-firebase/firestore';
import { Category } from '@/types/database';
import CategoryChip from '@/components/CategoryChip';
import FlashDeals from '@/components/FlashDeals';
import RecommendedProductGrid from '@/components/RecommendedProductGrid';
import SortSelector from '@/components/SortSelector';
import PCCarousel from '@/components/PCCarousel';

import WaveDivider from '@/components/WaveDivider';
import PandaLogo from '@/components/PandaLogo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients, Shadows, Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { useNotifications } from '@/contexts/NotificationContext';
import useProductRecommendations, { SortOption } from '@/hooks/useProductRecommendations';
import * as Haptics from 'expo-haptics';
import { OnboardingDebugButton } from '@/components/onboarding/OnboardingDebugButton';
import { useDebounce, profileCache } from '@/lib/performance';

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { cartItems } = useCart();
  const { unreadCount: notificationCount, refreshCount: refreshNotifications } = useNotifications();

  // Theme colors - Memoized pour éviter recalcul à chaque render
  const themeColors = useMemo(() => ({
    background: isDark ? '#111827' : Colors.white,
    card: isDark ? '#1F2937' : Colors.white,
    text: isDark ? '#F9FAFB' : Colors.dark,
    textSecondary: isDark ? '#D1D5DB' : Colors.textSecondary,
    textMuted: isDark ? '#9CA3AF' : Colors.textMuted,
    border: isDark ? '#374151' : '#E5E7EB',
    searchBg: isDark ? '#374151' : Colors.backgroundLight,
    inputBg: isDark ? '#1F2937' : Colors.white,
  }), [isDark]);

  // États locaux
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userShop, setUserShop] = useState<any>(null);
  const [sortOption] = useState<SortOption>('smart');

  // Debounce search query pour réduire les re-renders
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Utiliser le hook de recommandation pour les produits
  const {
    products,
    loading,
    refreshing,
    refresh: refreshProducts,
    changeSortOption,
    currentSortOption,
  } = useProductRecommendations({
    categoryId: selectedCategory,
    sortBy: sortOption,
    limit: 20,
  });

  const cartItemCount = useMemo(() => {
    return cartItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
  }, [cartItems]);

  useEffect(() => {
    fetchCategories();
    checkUserProfile();
  }, []);

  const checkUserProfile = useCallback(async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        // Vérifier le cache d'abord
        const cachedProfile = profileCache.get(user.id);
        if (cachedProfile) {
          setUserProfile(cachedProfile);
          if ((cachedProfile as any)?.is_seller) {
            const { data: shop } = await supabase
              .from('shops')
              .select('id, name')
              .eq('seller_id', user.id)
              .maybeSingle();
            setUserShop(shop);
          }
          return;
        }

        // Récupérer le profil si pas en cache
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', user.id)
          .maybeSingle();

        // Sauvegarder en cache
        if (profile) {
          profileCache.set(user.id, profile);
        }
        setUserProfile(profile);

        // Si c'est un vendeur, vérifier s'il a une boutique
        if (profile?.is_seller) {
          const { data: shop } = await supabase
            .from('shops')
            .select('id, name')
            .eq('seller_id', user.id)
            .maybeSingle();
          setUserShop(shop);
        }
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  }, []);

  const navigateToNotifications = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/notifications');
  }, [router]);

  const navigateToFavorites = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/favorites');
  }, [router]);

  const navigateToCart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/cart');
  }, [router]);

  const handleBuyPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/explore');
  }, [router]);

  const handleSellPress = useCallback(() => {
    if (userShop || userProfile?.is_seller) {
      // Le vendeur a déjà une boutique ou est vendeur -> Aller vers Ma Boutique avec édition temps réel
      router.push('/seller/my-shop');
    } else {
      // Pas encore vendeur -> Configuration vendeur
      router.push('/seller/setup');
    }
  }, [userProfile, userShop, router]);

  const fetchCategories = async () => {
    try {
      const db = getFirestore();
      const q = query(collection(db, 'categories'), orderBy('name'));
      const snapshot = await getDocs(q);

      const categoriesList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];

      setCategories(categoriesList);
    } catch (error) {
      console.error('Error fetching categories from Firestore:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    await refreshProducts();
    refreshNotifications();
  }, [refreshProducts, refreshNotifications]);

  // Utiliser debouncedSearchQuery au lieu de searchQuery pour filtrer
  const filteredProducts = useMemo(() =>
    products.filter((product) =>
      product.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ), [products, debouncedSearchQuery]
  );

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
  }, []);



  const ListHeader = () => (
    <View style={[styles.headerWrapper, { backgroundColor: themeColors.background }]}>
      {/* Hero Section - Stable sans parallaxe */}
      <View style={[styles.heroWrapper, { backgroundColor: isDark ? '#1F2937' : '#FFFACD' }]}>
        <LinearGradient
          colors={isDark ? ['#1F2937', '#374151'] as const : Gradients.hero.colors}
          start={Gradients.hero.start}
          end={Gradients.hero.end}
          style={styles.heroSection}>

          <View style={styles.heroContent}>
            {/* Logo + Brand inline + Actions */}
            <View style={styles.heroBrandRow}>
              <View style={styles.heroBrand}>
                <PandaLogo size="small" showText={false} />
                <View style={styles.brandTextContainer}>
                  <Text style={[styles.brandName, isDark && { color: '#F59E0B' }]}>senepanda</Text>
                  <Text style={[styles.brandTagline, { color: themeColors.textSecondary }]}>Marketplace Multi-Vendeurs</Text>
                </View>
              </View>

              {/* Icônes de navigation rapide */}
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={navigateToFavorites}
                  style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.8)' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Mes Favoris"
                >
                  <Heart size={20} color={isDark ? '#F59E0B' : '#EF4444'} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={navigateToNotifications}
                  style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.8)' }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Notifications - ${notificationCount} non lues`}
                >
                  <Bell size={20} color={isDark ? '#F59E0B' : '#F59E0B'} />
                  {notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={navigateToCart}
                  style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.8)' }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Panier avec ${cartItemCount} articles`}
                >
                  <ShoppingCart size={20} color={isDark ? '#F59E0B' : '#F59E0B'} />
                  {cartItemCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{cartItemCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroTitleRow}>
              <View style={styles.heroTitleContainer}>
                <Text style={[styles.heroTitleCompact, { color: themeColors.text }]}>
                  Achetez & Vendez{'\n'}en toute confiance
                </Text>
              </View>

              {/* PC Screen with carousel */}
              <PCCarousel />
            </View>

            {/* CTA Buttons - Côte à côte pour gagner de l'espace */}
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.ctaHalf}
                onPress={handleBuyPress}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Explorer les produits">
                <View style={styles.ctaHalfSolid}>
                  <View style={styles.ctaButtonContent}>
                    <ShoppingBag size={18} color={Colors.white} strokeWidth={2} />
                    <Text style={styles.ctaHalfText}>Acheter</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctaHalf}
                onPress={handleSellPress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={userShop ? "Accéder à ma boutique" : "Commencer à vendre"}>
                <View style={styles.ctaHalfOutline}>
                  <View style={styles.ctaButtonContent}>
                    <Store size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.ctaHalfTextOutline}>{userShop ? 'Ma Boutique' : 'Vendre'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

        </LinearGradient>

        {/* Wave Divider - Intégré dans le wrapper pour continuité parfaite */}
        <WaveDivider
          backgroundColor={isDark ? '#374151' : Colors.backgroundLemon}
          waveColor={themeColors.background}
          height={60}
          variant="smooth"
          animated={true}
        />
      </View>

      {/* Search Section - Compact */}
      <View style={[styles.searchSectionCompact, { backgroundColor: themeColors.searchBg }]}>
        <View style={[styles.searchInputWrapper, { backgroundColor: themeColors.inputBg }]}>
          <View style={styles.searchIconCircle}>
            <Search size={18} color={Colors.white} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={themeColors.textMuted}
          />
        </View>
      </View>

      {/* Categories Carousel - Compact */}
      <View style={[styles.categoriesQuickSection, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.sectionTitleCategories, { color: themeColors.text }]}>Catégories Populaires</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}>
          <CategoryChip
            name="Tous"
            icon="🛍️"
            isSelected={selectedCategory === null}
            onPress={() => handleCategorySelect(null)}
          />
          {categories.slice(0, 10).map((category) => (
            <CategoryChip
              key={category.id}
              name={category.name}
              icon={category.icon || '📦'}
              isSelected={selectedCategory === category.id}
              onPress={() => handleCategorySelect(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Infinite Scroll Video Feed is now managed in the Lives tab */}


      {/* Flash Deals Section */}
      <FlashDeals />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
          <ActivityIndicator size="large" color="#D97706" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: themeColors.background }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8C00']} />
          }>
          <ListHeader />

          {/* Sélecteur de tri */}
          <SortSelector
            currentSort={currentSortOption}
            onSortChange={changeSortOption}
            isDark={isDark}
          />

          {/* Section Recommandations - avec badges et stats */}
          {filteredProducts.length > 0 ? (
            <RecommendedProductGrid products={filteredProducts} />
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: themeColors.background }]}>
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>Aucun produit disponible</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Bouton flottant pour lancer le guide interactif */}
      <OnboardingDebugButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerWrapper: {
    backgroundColor: Colors.white,
  },

  // Hero Wrapper - Contient le gradient et le wave pour continuité parfaite
  heroWrapper: {
    backgroundColor: '#FFFACD', // Couleur de base qui match le gradient
    overflow: 'hidden', // Assure que le wave ne déborde pas
  },

  // Hero Section - Compact
  heroSection: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  heroContent: {
    width: '100%',
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  heroBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.small,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFACD',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  heroLogoCompact: {
    width: 64,
    height: 64,
  },
  brandTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  brandName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryOrange,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: Typography.fontWeight.medium,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['4xl'], // Encore plus d'espace
    gap: Spacing.md,
  },
  heroTitleContainer: {
    flex: 1,
  },
  heroTitleCompact: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    lineHeight: 32,
  },

  // Features Carousel
  featuresScrollView: {
    marginBottom: Spacing.lg,
  },
  featuresCarousel: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  featureCardCarousel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minWidth: 80,
    ...Shadows.medium,
  },
  featureIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  featureTextCarousel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // CTA Row - Côte à côte
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  ctaHalf: {
    flex: 1,
  },
  ctaHalfButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.medium,
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ctaHalfText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  ctaHalfSolid: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    ...Shadows.orange,
  },
  ctaHalfOutline: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    ...Shadows.small,
  },
  ctaHalfTextOutline: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: '#D97706',
    letterSpacing: 0.5,
  },

  // Section Title pour Catégories
  sectionTitleCategories: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  // Mini Section Title
  miniSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  // Stats Carousel
  statsSection: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.lg,
  },
  statsCarousel: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCardCarousel: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minWidth: 90,
    ...Shadows.small,
  },
  statIconCarousel: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  statNumberCarousel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: 2,
  },
  statLabelCarousel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Categories Quick Section - S'aligne parfaitement après le wave
  categoriesQuickSection: {
    backgroundColor: Colors.white,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  categoriesContainer: {
    marginTop: Spacing.sm,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },

  // Search Section - Ultra Compact
  searchSectionCompact: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundLight,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  searchIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: Typography.fontSize.sm,
    color: Colors.dark,
  },

  // Section Titles
  sectionTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },

  // Products Header - Compact
  productsHeaderCompact: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  productsGrid: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
});
