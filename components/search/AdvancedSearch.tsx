/**
 * Composant de recherche avancée avec filtres
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Search, X, SlidersHorizontal, TrendingUp } from 'lucide-react-native';
import { useProductSearch, SearchFilters, SearchOptions } from '../../hooks/useProductSearch';
import { useRouter } from 'expo-router';
import { useDebounce } from '../../hooks/useDebounce';

interface Props {
  onResultPress?: (productId: string) => void;
  placeholder?: string;
  initialFilters?: SearchFilters;
  initialOptions?: SearchOptions;
}

export function AdvancedSearch({
  onResultPress,
  placeholder = 'Rechercher des produits...',
  initialFilters = {},
  initialOptions = {},
}: Props) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [options, setOptions] = useState<SearchOptions>(initialOptions);

  const { results, loading, totalResults, searchTime, search, clearSearch } = useProductSearch();

  // Debounce pour éviter trop de requêtes
  const debouncedSearch = useDebounce((value: string) => {
    if (value.trim().length > 0) {
      search(value, filters, options);
    } else {
      clearSearch();
    }
  }, 300);

  const handleTextChange = useCallback(
    (text: string) => {
      setInputValue(text);
      debouncedSearch(text);
    },
    [debouncedSearch]
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    clearSearch();
  }, [clearSearch]);

  const handleResultPress = useCallback(
    (productId: string) => {
      if (onResultPress) {
        onResultPress(productId);
      } else {
        router.push(`/products/${productId}`);
      }
    },
    [onResultPress, router]
  );

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('fr-FR')} ${currency}`;
  };

  const renderResult = ({ item }: { item: typeof results[0] }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item.id)}
    >
      <Image
        source={{
          uri: item.image_url || 'https://via.placeholder.com/60x60?text=Produit',
        }}
        style={styles.resultImage}
      />

      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.resultShop} numberOfLines={1}>
          {item.shop_name || item.seller_name}
        </Text>

        <View style={styles.resultFooter}>
          <Text style={styles.resultPrice}>
            {formatPrice(item.price, item.currency || 'FCFA')}
          </Text>

          {item.stock > 0 ? (
            <Text style={styles.inStock}>En stock</Text>
          ) : (
            <Text style={styles.outOfStock}>Rupture</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={20} color="#64748B" style={styles.searchIcon} />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={inputValue}
          onChangeText={handleTextChange}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {loading && <ActivityIndicator size="small" color="#FF6B6B" />}

        {inputValue.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Search Stats */}
      {totalResults > 0 && (
        <View style={styles.statsBar}>
          <TrendingUp size={16} color="#10B981" />
          <Text style={styles.statsText}>
            {totalResults} résultat{totalResults > 1 ? 's' : ''} en {searchTime}ms
          </Text>
        </View>
      )}

      {/* Results */}
      {results.length > 0 && (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* No Results */}
      {inputValue.length > 0 && !loading && results.length === 0 && (
        <View style={styles.noResults}>
          <Search size={48} color="#CBD5E1" />
          <Text style={styles.noResultsTitle}>Aucun résultat</Text>
          <Text style={styles.noResultsText}>
            Essayez avec d'autres mots-clés
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  clearButton: {
    padding: 4,
    marginHorizontal: 8,
  },
  filterButton: {
    padding: 4,
    marginLeft: 8,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    marginTop: 12,
  },
  statsText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '500',
  },
  resultsList: {
    marginTop: 12,
  },
  resultsContent: {
    gap: 12,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  resultShop: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  inStock: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  outOfStock: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
