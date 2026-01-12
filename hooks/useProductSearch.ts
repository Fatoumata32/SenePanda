/**
 * Hook pour la recherche de produits avec Meilisearch
 */

import { useState, useEffect, useCallback } from 'react';
import { meilisearchClient, ProductSearchResult } from '../lib/meilisearchClient';
import { useLogger } from './useLogger';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  inStockOnly?: boolean;
}

export interface SearchOptions {
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  limit?: number;
}

export function useProductSearch() {
  const log = useLogger('useProductSearch');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);

  const buildFilterString = useCallback((filters: SearchFilters): string => {
    const conditions: string[] = ['is_active = true'];

    if (filters.category) {
      conditions.push(`category = "${filters.category}"`);
    }

    if (filters.minPrice !== undefined) {
      conditions.push(`price >= ${filters.minPrice}`);
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(`price <= ${filters.maxPrice}`);
    }

    if (filters.sellerId) {
      conditions.push(`seller_id = "${filters.sellerId}"`);
    }

    if (filters.inStockOnly) {
      conditions.push('stock > 0');
    }

    return conditions.join(' AND ');
  }, []);

  const getSortArray = useCallback((sortBy: SearchOptions['sortBy']): string[] | undefined => {
    switch (sortBy) {
      case 'price_asc':
        return ['price:asc'];
      case 'price_desc':
        return ['price:desc'];
      case 'newest':
        return ['created_at:desc'];
      case 'relevance':
      default:
        return undefined;
    }
  }, []);

  const search = useCallback(
    async (
      searchQuery: string,
      filters: SearchFilters = {},
      options: SearchOptions = {}
    ) => {
      setLoading(true);
      setQuery(searchQuery);

      try {
        const filterString = buildFilterString(filters);
        const sort = getSortArray(options.sortBy);

        log.debug('Performing search', {
          query: searchQuery,
          filters: filterString,
          sort,
        });

        const response = await meilisearchClient.searchProducts(searchQuery, {
          filters: filterString,
          sort,
          limit: options.limit || 20,
        });

        setResults(response.hits);
        setTotalResults(response.estimatedTotalHits || 0);
        setSearchTime(response.processingTimeMs);

        log.info('Search completed', {
          query: searchQuery,
          resultsCount: response.hits.length,
          totalResults: response.estimatedTotalHits,
          time: response.processingTimeMs,
        });
      } catch (error) {
        log.error('Search failed', error as Error);
        setResults([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    },
    [buildFilterString, getSortArray, log]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotalResults(0);
    setSearchTime(0);
  }, []);

  return {
    query,
    results,
    loading,
    totalResults,
    searchTime,
    search,
    clearSearch,
  };
}
