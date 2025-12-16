import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import {
  Search as SearchIcon,
  X,
  Clock,
  TrendingUp,
  Package,
  Store,
  Grid,
  ArrowRight,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

type SearchFilter = 'all' | 'products' | 'shops' | 'categories';

interface SearchResult {
  id: string;
  type: 'product' | 'shop' | 'category';
  title: string;
  subtitle?: string;
  image_url?: string;
  price?: number;
}

const SEARCH_HISTORY_KEY = '@search_history';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setShowHistory(true);
    }
  }, [searchQuery, activeFilter]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchToHistory = async (query: string) => {
    try {
      const updatedHistory = [
        query,
        ...searchHistory.filter(item => item !== query),
      ].slice(0, 10);
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      Speech.speak('Historique effacé', { language: 'fr-FR' });
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowHistory(false);

    try {
      const searchResults: SearchResult[] = [];

      // Recherche de produits
      if (activeFilter === 'all' || activeFilter === 'products') {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, images, shop_id, views_count')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .eq('is_active', true)
          .limit(20);

        if (!productsError && products) {
          searchResults.push(
            ...products.map(p => ({
              id: p.id,
              type: 'product' as const,
              title: p.name,
              subtitle: `${p.price} FCFA`,
              image_url: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined,
              price: p.price,
            }))
          );
        }
      }

      // Recherche de boutiques
      if (activeFilter === 'all' || activeFilter === 'shops') {
        const { data: shops, error: shopsError } = await supabase
          .from('shops')
          .select('id, name, description, logo_url, rating')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .eq('is_active', true)
          .limit(10);

        if (!shopsError && shops) {
          searchResults.push(
            ...shops.map(s => ({
              id: s.id,
              type: 'shop' as const,
              title: s.name,
              subtitle: s.rating ? `⭐ ${s.rating.toFixed(1)}` : 'Nouvelle boutique',
              image_url: s.logo_url,
            }))
          );
        }
      }

      // Recherche de catégories
      if (activeFilter === 'all' || activeFilter === 'categories') {
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, emoji, products_count')
          .ilike('name', `%${searchQuery}%`)
          .eq('is_active', true)
          .limit(5);

        if (!categoriesError && categories) {
          searchResults.push(
            ...categories.map(c => ({
              id: c.id,
              type: 'category' as const,
              title: `${c.emoji || '📦'} ${c.name}`,
              subtitle: `${c.products_count || 0} produits`,
            }))
          );
        }
      }

      setResults(searchResults);

      // Sauvegarder dans l'historique
      if (searchQuery.trim()) {
        await saveSearchToHistory(searchQuery.trim());
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    switch (result.type) {
      case 'product':
        router.push(`/product/${result.id}` as any);
        break;
      case 'shop':
        router.push(`/shop/${result.id}` as any);
        break;
      case 'category':
        router.push(`/category/${result.id}` as any);
        break;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package size={20} color={Colors.primaryOrange} />;
      case 'shop':
        return <Store size={20} color={Colors.primaryGold} />;
      case 'category':
        return <Grid size={20} color={Colors.textSecondary} />;
      default:
        return null;
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.resultImage} />
      ) : (
        <View style={[styles.resultImage, styles.resultImagePlaceholder]}>
          {getResultIcon(item.type)}
        </View>
      )}

      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {getResultIcon(item.type)}
        </View>
        {item.subtitle && (
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>

      <ArrowRight size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        setSearchQuery(item);
        setShowHistory(false);
      }}>
      <Clock size={18} color={Colors.textMuted} />
      <Text style={styles.historyText}>{item}</Text>
      <TouchableOpacity
        onPress={() => {
          const updated = searchHistory.filter(h => h !== item);
          setSearchHistory(updated);
          AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
        }}>
        <X size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filters: { key: SearchFilter; label: string; icon: any }[] = [
    { key: 'all', label: 'Tous', icon: Grid },
    { key: 'products', label: 'Produits', icon: Package },
    { key: 'shops', label: 'Boutiques', icon: Store },
    { key: 'categories', label: 'Catégories', icon: TrendingUp },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header avec barre de recherche */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher produits, boutiques..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              performSearch();
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter.key)}>
            <filter.icon
              size={16}
              color={activeFilter === filter.key ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.key && styles.filterTextActive,
              ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu principal */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      ) : showHistory && searchHistory.length > 0 ? (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recherches récentes</Text>
            <TouchableOpacity onPress={clearSearchHistory}>
              <Text style={styles.clearHistoryText}>Effacer tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => `history-${index}`}
          />
        </View>
      ) : results.length > 0 ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </Text>
          <FlatList
            data={results}
            renderItem={renderSearchResult}
            keyExtractor={item => `${item.type}-${item.id}`}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : searchQuery.length >= 2 ? (
        <View style={styles.emptyContainer}>
          <SearchIcon size={80} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptySubtitle}>
            Essayez d'autres mots-clés ou ajustez vos filtres
          </Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <SearchIcon size={80} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Recherchez quelque chose</Text>
          <Text style={styles.emptySubtitle}>
            Produits, boutiques, catégories...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    padding: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundLight,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryOrange,
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  filterTextActive: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  historyContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  historyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  clearHistoryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryOrange,
    fontWeight: Typography.fontWeight.semibold,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  historyText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  resultsContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  resultsCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
    gap: Spacing.md,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  resultImagePlaceholder: {
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  resultTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  resultSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
