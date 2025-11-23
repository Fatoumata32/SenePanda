import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Category, Product } from '@/types/database';
import { Search, Mic, Star } from 'lucide-react-native';
import { getCategoryIcon } from '@/constants/CategoryIcons';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  // Theme colors
  const themeColors = {
    background: isDark ? '#111827' : '#F9FAFB',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    textMuted: isDark ? '#9CA3AF' : '#9CA3AF',
    border: isDark ? '#374151' : '#E5E7EB',
    iconBg: isDark ? '#374151' : '#F3F4F6',
  };
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'popular'>('recent');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allProducts, searchQuery, selectedCategory, sortBy]);

  const loadData = async () => {
    try {
      // Charger toutes les catégories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setCategories(categoriesData || []);

      // Charger tous les produits actifs avec informations du vendeur
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!seller_id(
            id,
            shop_name,
            shop_logo_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setAllProducts(productsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
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
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
    }

    setFilteredProducts(filtered.slice(0, 20)); // Limiter à 20 produits
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: themeColors.card }]}>
            <Search size={20} color={themeColors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Rechercher des produits..."
              placeholderTextColor={themeColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity>
              <Mic size={22} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtres par catégorie */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Catégories</Text>
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
                  <View style={[styles.iconCircle, { backgroundColor: themeColors.iconBg }]}>
                    {(() => {
                      const TousIcon = getCategoryIcon('Tous');
                      return <TousIcon size={18} color={themeColors.textSecondary} strokeWidth={2.5} />;
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
                      <View style={[styles.iconCircle, { backgroundColor: themeColors.iconBg }]}>
                        <CategoryIcon size={18} color={themeColors.textSecondary} strokeWidth={2.5} />
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
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Produits ({filteredProducts.length})
          </Text>

          {filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.productCard, { backgroundColor: themeColors.card }]}
                  onPress={() => router.push(`/product/${product.id}`)}>
                  <Image
                    source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={[styles.productTitle, { color: themeColors.text }]} numberOfLines={2}>
                      {product.title}
                    </Text>
                    <Text style={styles.productPrice}>
                      {product.price} {product.currency || 'XOF'}
                    </Text>
                    {product.average_rating > 0 && (
                      <View style={styles.ratingContainer}>
                        <Star size={14} color="#FFA500" fill="#FFA500" />
                        <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>{product.average_rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>Aucun produit trouvé</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  categoryCardActive: {
    borderColor: '#FFA500',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryGradient: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryNameActive: {
    color: '#FFFFFF',
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
    gap: 12,
  },
  productCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
