import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Category, Product } from '@/types/database';
import { Search, Mic, Star, Video, Eye, Users, Store, X, MapPin } from 'lucide-react-native';
import { getCategoryIcon, getCategoryColors } from '@/constants/CategoryIcons';
import { useTheme } from '@/contexts/ThemeContext';
import { useActiveLiveSessions } from '@/hooks/useLiveShopping';
import { useDebounce, productsCache } from '@/lib/performance';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  // Theme colors - Memoized
  const themeColors = useMemo(() => ({
    background: isDark ? '#111827' : '#F9FAFB',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    textMuted: isDark ? '#9CA3AF' : '#9CA3AF',
    border: isDark ? '#374151' : '#E5E7EB',
    iconBg: isDark ? '#374151' : '#F3F4F6',
  }), [isDark]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'popular'>('recent');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  // États pour le modal des boutiques
  const [shopsModalVisible, setShopsModalVisible] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [shopsSearchQuery, setShopsSearchQuery] = useState('');
  const [loadingShops, setLoadingShops] = useState(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedShopsSearch = useDebounce(shopsSearchQuery, 300);

  // Hook pour les lives actifs
  const { sessions: activeLives, isLoading: loadingLives } = useActiveLiveSessions(10);

  useEffect(() => {
    loadData();
  }, []);

  // Synchronisation en temps réel des produits
  useEffect(() => {
    const productsChannel = supabase
      .channel('all-products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Product changed in explorer:', payload);

          if (payload.eventType === 'INSERT' && payload.new) {
            // Nouveau produit ajouté
            setAllProducts(prev => [payload.new as Product, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Produit mis à jour
            setAllProducts(prev =>
              prev.map(p => p.id === payload.new.id ? payload.new as Product : p)
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Produit supprimé
            setAllProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoadingProducts(true);

      // Vérifier le cache d'abord et afficher immédiatement
      const cachedProducts = productsCache.get('all_products');
      if (cachedProducts) {
        setAllProducts(cachedProducts);
        setIsLoadingProducts(false);
      }

      // Charger catégories ET produits en parallèle
      const [categoriesResult, productsResult] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .order('name'),
        supabase
          .from('products')
          .select(`
            id,
            title,
            name,
            description,
            price,
            image_url,
            category_id,
            seller_id,
            created_at,
            updated_at,
            is_active,
            views_count,
            average_rating,
            discount_percentage,
            has_discount,
            original_price,
            currency,
            images,
            stock,
            condition,
            seller:profiles!seller_id(
              id,
              shop_name
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(PRODUCTS_PER_PAGE * 3) // Charger 60 produits initialement
      ]);

      // Mettre à jour les catégories
      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      // Mettre à jour les produits
      if (productsResult.error) {
        console.error('Error loading products:', productsResult.error);
      } else if (productsResult.data) {
        productsCache.set('all_products', productsResult.data);
        setAllProducts(productsResult.data);
        setHasMore(productsResult.data.length >= PRODUCTS_PER_PAGE * 3);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Fonction pour charger les boutiques
  const loadShops = useCallback(async () => {
    setLoadingShops(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, shop_name, shop_description, shop_logo_url, city, is_seller, average_rating, total_reviews')
        .eq('is_seller', true)
        .not('shop_name', 'is', null)
        .order('average_rating', { ascending: false })
        .limit(50);

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoadingShops(false);
    }
  }, []);

  // Charger les boutiques quand le modal s'ouvre
  useEffect(() => {
    if (shopsModalVisible) {
      loadShops();
    }
  }, [shopsModalVisible, loadShops]);

  // Fonction pour charger plus de produits
  const loadMoreProducts = useCallback(async () => {
    if (!hasMore || isLoadingProducts) return;

    try {
      setIsLoadingProducts(true);
      const nextPage = page + 1;
      const offset = page * PRODUCTS_PER_PAGE * 3;

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          name,
          description,
          price,
          image_url,
          category_id,
          seller_id,
          created_at,
          updated_at,
          is_active,
          views_count,
          average_rating,
          discount_percentage,
          has_discount,
          original_price,
          currency,
          images,
          stock,
          condition,
          seller:profiles!seller_id(
            id,
            shop_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + PRODUCTS_PER_PAGE * 3 - 1);

      if (error) {
        console.error('Error loading more products:', error);
      } else if (data) {
        const updatedProducts = [...allProducts, ...data];
        setAllProducts(updatedProducts);
        productsCache.set('all_products', updatedProducts);
        setPage(nextPage);
        setHasMore(data.length >= PRODUCTS_PER_PAGE * 3);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [hasMore, isLoadingProducts, page, allProducts]);

  // Filtrer les boutiques par recherche
  const filteredShops = useMemo(() => {
    if (!debouncedShopsSearch.trim()) return shops;

    const query = debouncedShopsSearch.toLowerCase();
    return shops.filter(shop =>
      shop.shop_name?.toLowerCase().includes(query) ||
      shop.shop_description?.toLowerCase().includes(query) ||
      shop.city?.toLowerCase().includes(query)
    );
  }, [shops, debouncedShopsSearch]);

  // Mémoriser les filtres - utiliser debouncedSearchQuery
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Filtre par recherche (debounced)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.name?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_id === selectedCategory);
    }

    // Tri
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
    }

    return filtered;
  }, [allProducts, debouncedSearchQuery, selectedCategory, sortBy]);

  // Fonction utilitaire pour formater le prix
  const formatPrice = (price: number | null | undefined): string => {
    if (!price && price !== 0) return '0';
    return price.toLocaleString('fr-FR');
  };

  // Fonction utilitaire pour calculer le prix discount
  const calculateDiscountedPrice = (price: number | null | undefined, discount: number | null | undefined): number => {
    if (!price || !discount) return price || 0;
    return price * (1 - discount / 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Barre de recherche avec bouton Boutiques - AMÉLIORATION VISUELLE */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card }]}>
            <LinearGradient
              colors={['#FF8C42', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchIconCircle}
            >
              <Search size={20} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Que recherchez-vous ?"
              placeholderTextColor={themeColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bouton Boutiques avec gradient */}
          <TouchableOpacity
            style={styles.shopsButtonCompact}
            onPress={() => setShopsModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FF8C42', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shopsButtonGradient}
            >
              <Store size={22} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Lives en cours */}
        {!loadingLives && activeLives.length > 0 && (
          <View style={styles.section}>
            <View style={styles.livesHeader}>
              <View style={styles.livesTitleContainer}>
                <View style={styles.liveIndicator} />
                <View>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Lives en cours</Text>
                  <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
                    Rejoignez les vendeurs en direct
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/lives' as any)} style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>Tout voir</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.livesScroll}
            >
              {activeLives.map((live) => (
                <TouchableOpacity
                  key={live.id}
                  style={styles.liveCard}
                  onPress={() => router.push({ pathname: '/(tabs)/live-viewer/[id]', params: { id: live.id } } as any)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8C42']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.liveCardGradient}
                  >
                    <View style={styles.liveBadge}>
                      <View style={styles.liveBadgePulse} />
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>

                    {live.thumbnail_url ? (
                      <Image
                        source={{ uri: live.thumbnail_url }}
                        style={styles.liveThumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.liveThumbnailPlaceholder}>
                        <Video size={48} color="rgba(255, 255, 255, 0.9)" strokeWidth={2} />
                      </View>
                    )}

                    <LinearGradient
                      colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                      style={styles.liveOverlay}
                    >
                      <View style={styles.liveSellerInfo}>
                        {live.seller_avatar ? (
                          <Image source={{ uri: live.seller_avatar }} style={styles.liveSellerAvatar} />
                        ) : (
                          <View style={styles.liveSellerAvatarPlaceholder}>
                            <Text style={styles.liveSellerAvatarText}>
                              {live.seller_name?.[0]?.toUpperCase() || '?'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.liveSellerTextContainer}>
                          <Text style={styles.liveSellerName} numberOfLines={1}>
                            {live.seller_name || 'Vendeur'}
                          </Text>
                          <Text style={styles.liveTitle} numberOfLines={1}>
                            {live.title}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.liveViewerCount}>
                        <Users size={14} color="#FFFFFF" />
                        <Text style={styles.liveViewerText}>
                          {live.viewer_count || 0}
                        </Text>
                      </View>
                    </LinearGradient>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Filtres par catégorie */}
        <View style={styles.section}>
          <View style={styles.categoriesHeaderWrapper}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Catégories</Text>
            <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
              {selectedCategory ? 'Filtré par catégorie' : 'Tous les produits'}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}>
            {/* Bouton "Tout" */}
            <TouchableOpacity
              style={[styles.categoryCard, !selectedCategory && styles.categoryCardActive]}
              onPress={() => setSelectedCategory(null)}>
              {!selectedCategory ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryGradient}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                    {(() => {
                      const TousIcon = getCategoryIcon('Tous');
                      return <TousIcon size={20} color="#FFFFFF" strokeWidth={2.5} />;
                    })()}
                  </View>
                  <Text style={[styles.categoryName, styles.categoryNameActive]}>
                    Tout
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.categoryGradient}>
                  <View style={[styles.iconCircle, { backgroundColor: getCategoryColors('Tous').bg }]}>
                    {(() => {
                      const TousIcon = getCategoryIcon('Tous');
                      return <TousIcon size={18} color={getCategoryColors('Tous').icon} strokeWidth={2.5} />;
                    })()}
                  </View>
                  <Text style={[styles.categoryName, { color: themeColors.text }]}>
                    Tout
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {categories.map((category) => {
              const CategoryIcon = getCategoryIcon(category.name);
              const categoryColors = getCategoryColors(category.name);
              const isActive = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryCard, isActive && styles.categoryCardActive]}
                  onPress={() => setSelectedCategory(category.id)}>
                  {isActive ? (
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.categoryGradient}>
                      <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                        <CategoryIcon size={20} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                      <Text style={[styles.categoryName, styles.categoryNameActive]}>
                        {category.name}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.categoryGradient}>
                      <View style={[styles.iconCircle, { backgroundColor: categoryColors.bg }]}>
                        <CategoryIcon size={18} color={categoryColors.icon} strokeWidth={2.5} />
                      </View>
                      <Text style={[styles.categoryName, { color: themeColors.text }]}>
                        {category.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filtres de tri */}
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => setSortBy('recent')}>
              {sortBy === 'recent' ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.filterGradient}>
                  <Text style={styles.filterTextActive}>Plus récents</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.filterInactive, { backgroundColor: themeColors.card }]}>
                  <Text style={[styles.filterText, { color: themeColors.textSecondary }]}>Plus récents</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => setSortBy('popular')}>
              {sortBy === 'popular' ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.filterGradient}>
                  <Text style={styles.filterTextActive}>Populaires</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.filterInactive, { backgroundColor: themeColors.card }]}>
                  <Text style={[styles.filterText, { color: themeColors.textSecondary }]}>Populaires</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => setSortBy('price-low')}>
              {sortBy === 'price-low' ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.filterGradient}>
                  <Text style={styles.filterTextActive}>Prix croissant</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.filterInactive, { backgroundColor: themeColors.card }]}>
                  <Text style={[styles.filterText, { color: themeColors.textSecondary }]}>Prix croissant</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, { borderColor: themeColors.border }]}
              onPress={() => setSortBy('price-high')}>
              {sortBy === 'price-high' ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.filterGradient}>
                  <Text style={styles.filterTextActive}>Prix décroissant</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.filterInactive, { backgroundColor: themeColors.card }]}>
                  <Text style={[styles.filterText, { color: themeColors.textSecondary }]}>Prix décroissant</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Produits filtrés */}
        <View style={styles.section}>
          <View style={styles.productsHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Produits
            </Text>
            {!isLoadingProducts && (
              <View style={styles.productsCountBadge}>
                <Text style={styles.productsCountText}>{filteredProducts.length}</Text>
              </View>
            )}
          </View>

          {isLoadingProducts && allProducts.length === 0 ? (
            <View style={styles.productsGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={[styles.productCard, styles.skeletonCard, { backgroundColor: themeColors.card }]}>
                  <View style={[styles.skeletonImage, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                  <View style={styles.productInfo}>
                    <View style={[styles.skeletonLine, styles.skeletonShort, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                    <View style={[styles.skeletonLine, styles.skeletonLong, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                    <View style={[styles.skeletonLine, styles.skeletonMedium, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                  </View>
                </View>
              ))}
            </View>
          ) : filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => {
                const price = product.price || 0;
                const discount = product.discount_percentage || 0;
                const hasDiscount = discount > 0;
                const discountedPrice = hasDiscount ? calculateDiscountedPrice(price, discount) : price;
                
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productCard, { backgroundColor: themeColors.card }]}
                    onPress={() => router.push(`/product/${product.id}`)}
                    activeOpacity={0.9}>
                    {/* Badge de réduction si applicable */}
                    {hasDiscount && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{discount}%</Text>
                      </View>
                    )}

                    <Image
                      source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
                      style={styles.productImage}
                    />

                    <View style={styles.productInfo}>
                      {/* Nom de la boutique */}
                      {product.seller?.shop_name ? (
                        <View style={styles.shopBadge}>
                          <Text style={[styles.shopName, { color: themeColors.textSecondary }]} numberOfLines={1}>
                            {product.seller.shop_name}
                          </Text>
                        </View>
                      ) : null}

                      <Text style={[styles.productTitle, { color: themeColors.text }]} numberOfLines={2}>
                        {product.name || product.title || 'Produit'}
                      </Text>

                      <View style={styles.priceRow}>
                        {hasDiscount ? (
                          <View style={styles.discountedPriceContainer}>
                            <Text style={styles.productPriceDiscounted}>
                              {formatPrice(discountedPrice)} FCFA
                            </Text>
                            <Text style={styles.productPriceOriginal}>
                              {formatPrice(price)} FCFA
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.productPrice}>
                            {formatPrice(price)} FCFA
                          </Text>
                        )}
                      </View>

                      <View style={styles.productFooter}>
                        {(product.average_rating || 0) > 0 ? (
                          <View style={styles.ratingContainer}>
                            <Star size={14} color="#FFA500" fill="#FFA500" />
                            <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>
                              {(product.average_rating || 0).toFixed(1)}
                            </Text>
                          </View>
                        ) : null}

                        {(product.views_count || 0) > 0 ? (
                          <View style={styles.viewsContainer}>
                            <Eye size={12} color={themeColors.textMuted} />
                            <Text style={[styles.viewsText, { color: themeColors.textMuted }]}>
                              {product.views_count || 0}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Search size={40} color={themeColors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Aucun produit trouvé</Text>
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                Essayez de modifier vos filtres ou votre recherche
              </Text>
            </View>
          )}

          {/* Bouton Charger Plus */}
          {!isLoadingProducts && hasMore && filteredProducts.length > 0 && !searchQuery && (
            <View style={styles.loadMoreContainer}>
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMoreProducts}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF8C42', '#FFA500', '#FFD700']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loadMoreGradient}
                >
                  <Text style={styles.loadMoreText}>Charger plus de produits</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL DES BOUTIQUES */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shopsModalVisible}
        onRequestClose={() => setShopsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShopsModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            {/* Header du modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconCircle}>
                  <Store size={24} color="#FF8C42" strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                    Toutes les boutiques
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
                    {filteredShops.length} boutique{filteredShops.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShopsModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {/* Barre de recherche boutiques */}
            <View style={[styles.modalSearchBar, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
              <Search size={18} color={themeColors.textMuted} />
              <TextInput
                style={[styles.modalSearchInput, { color: themeColors.text }]}
                placeholder="Rechercher une boutique..."
                placeholderTextColor={themeColors.textMuted}
                value={shopsSearchQuery}
                onChangeText={setShopsSearchQuery}
              />
              {shopsSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setShopsSearchQuery('')}>
                  <X size={18} color={themeColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Liste des boutiques */}
            {loadingShops ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#FF8C42" />
                <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                  Chargement des boutiques...
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredShops}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.shopsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.shopItem, { backgroundColor: themeColors.background }]}
                    onPress={() => {
                      setShopsModalVisible(false);
                      router.push(`/shop/${item.id}`);
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Logo boutique */}
                    <View style={styles.shopLogoContainer}>
                      {item.shop_logo_url ? (
                        <Image
                          source={{ uri: item.shop_logo_url }}
                          style={styles.shopLogo}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.shopLogoPlaceholder, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                          <Store size={24} color="#FF8C42" />
                        </View>
                      )}
                    </View>

                    {/* Infos boutique */}
                    <View style={styles.modalShopInfo}>
                      <Text style={[styles.modalShopName, { color: themeColors.text }]} numberOfLines={1}>
                        {item.shop_name}
                      </Text>
                      {item.shop_description && (
                        <Text style={[styles.modalShopDescription, { color: themeColors.textSecondary }]} numberOfLines={2}>
                          {item.shop_description}
                        </Text>
                      )}
                      <View style={styles.modalShopMeta}>
                        {item.city && (
                          <View style={styles.modalShopMetaItem}>
                            <MapPin size={12} color={themeColors.textMuted} />
                            <Text style={[styles.modalShopMetaText, { color: themeColors.textMuted }]}>
                              {item.city}
                            </Text>
                          </View>
                        )}
                        {item.average_rating > 0 && (
                          <View style={styles.modalShopMetaItem}>
                            <Star size={12} color="#FFA500" fill="#FFA500" />
                            <Text style={[styles.modalShopMetaText, { color: themeColors.textMuted }]}>
                              {item.average_rating.toFixed(1)} ({item.total_reviews || 0})
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyShops}>
                    <Store size={48} color={themeColors.textMuted} strokeWidth={1.5} />
                    <Text style={[styles.emptyShopsText, { color: themeColors.text }]}>
                      Aucune boutique trouvée
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Pas de header - commence avec la recherche
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
  },
  searchIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#D97706',
    fontWeight: '700',
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  categoriesHeaderWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productsCountBadge: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  productsCountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    borderRadius: 9999,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardActive: {
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryGradient: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  categoryNameActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  filterGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterInactive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  filterTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 16,
  },
  productCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 140, 66, 0.08)',
    marginBottom: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F9FAFB',
  },
  productInfo: {
    padding: 14,
    gap: 2,
  },
  shopBadge: {
    marginBottom: 6,
  },
  shopName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
    minHeight: 40,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  discountedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FF8C42',
    letterSpacing: -0.5,
  },
  productPriceDiscounted: {
    fontSize: 17,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: -0.5,
  },
  productPriceOriginal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
    textDecorationLine: 'line-through',
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  ratingText: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '800',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Lives Section
  livesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  livesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  liveIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginTop: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  livesScroll: {
    paddingRight: 16,
  },
  liveCard: {
    width: 300,
    height: 200,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  liveCardGradient: {
    flex: 1,
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  liveBadgePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveThumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  liveThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  liveOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  liveSellerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveSellerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  liveSellerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  liveSellerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveSellerTextContainer: {
    flex: 1,
  },
  liveSellerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  liveTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  liveViewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveViewerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Bouton Boutiques compact (à côté de la recherche)
  shopsButtonCompact: {
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  shopsButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopsIconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Boutiques
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  shopsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  shopItem: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  shopLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
  },
  shopLogo: {
    width: '100%',
    height: '100%',
  },
  shopLogoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalShopInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  modalShopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modalShopDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  modalShopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalShopMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalShopMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  emptyShops: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyShopsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  // Skeleton Loading Styles
  skeletonCard: {
    opacity: 0.6,
  },
  skeletonImage: {
    width: '100%',
    height: 170,
    backgroundColor: '#E5E7EB',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonShort: {
    width: '40%',
  },
  skeletonMedium: {
    width: '60%',
  },
  skeletonLong: {
    width: '90%',
  },
  // Load More Button
  loadMoreContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  loadMoreButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loadMoreGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});