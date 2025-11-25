/**
 * Meilisearch Service
 * Recherche full-text pour produits, boutiques et utilisateurs
 */

import { MeiliSearch, SearchResponse } from 'meilisearch';

const MEILISEARCH_HOST = process.env.EXPO_PUBLIC_MEILISEARCH_HOST;
const MEILISEARCH_API_KEY = process.env.EXPO_PUBLIC_MEILISEARCH_API_KEY;

// Initialiser le client seulement si configuré
let searchClient: MeiliSearch | null = null;

if (MEILISEARCH_HOST && MEILISEARCH_API_KEY) {
  searchClient = new MeiliSearch({
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_API_KEY,
  });
}

// Noms des index
export const INDEXES = {
  PRODUCTS: 'products',
  SHOPS: 'shops',
  USERS: 'users',
  CATEGORIES: 'categories',
} as const;

// Types de résultats de recherche
export interface ProductSearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  category_name: string;
  shop_id: string;
  shop_name: string;
  images: string[];
  rating: number;
  stock: number;
  is_featured: boolean;
  created_at: string;
}

export interface ShopSearchResult {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  owner_id: string;
  rating: number;
  products_count: number;
  followers_count: number;
}

export interface UserSearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_seller: boolean;
}

export interface CategorySearchResult {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  products_count: number;
}

/**
 * Vérifier si Meilisearch est configuré
 */
export function isSearchConfigured(): boolean {
  return searchClient !== null;
}

/**
 * Rechercher des produits
 */
export async function searchProducts(
  query: string,
  options?: {
    filters?: string;
    sort?: string[];
    limit?: number;
    offset?: number;
    facets?: string[];
  }
): Promise<SearchResponse<ProductSearchResult>> {
  if (!searchClient) {
    throw new Error('Meilisearch n\'est pas configuré');
  }

  const index = searchClient.index(INDEXES.PRODUCTS);

  return await index.search(query, {
    filter: options?.filters,
    sort: options?.sort,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    facets: options?.facets || ['category_name', 'shop_name'],
    attributesToHighlight: ['name', 'description'],
  });
}

/**
 * Rechercher des boutiques
 */
export async function searchShops(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<SearchResponse<ShopSearchResult>> {
  if (!searchClient) {
    throw new Error('Meilisearch n\'est pas configuré');
  }

  const index = searchClient.index(INDEXES.SHOPS);

  return await index.search(query, {
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    attributesToHighlight: ['name', 'description'],
  });
}

/**
 * Rechercher des utilisateurs
 */
export async function searchUsers(
  query: string,
  options?: {
    filters?: string;
    limit?: number;
  }
): Promise<SearchResponse<UserSearchResult>> {
  if (!searchClient) {
    throw new Error('Meilisearch n\'est pas configuré');
  }

  const index = searchClient.index(INDEXES.USERS);

  return await index.search(query, {
    filter: options?.filters,
    limit: options?.limit || 20,
    attributesToHighlight: ['username', 'full_name'],
  });
}

/**
 * Recherche multi-index (produits, boutiques, utilisateurs)
 */
export async function searchAll(
  query: string,
  limit: number = 5
): Promise<{
  products: ProductSearchResult[];
  shops: ShopSearchResult[];
  users: UserSearchResult[];
}> {
  if (!searchClient) {
    return { products: [], shops: [], users: [] };
  }

  try {
    const [productsResult, shopsResult, usersResult] = await Promise.all([
      searchProducts(query, { limit }),
      searchShops(query, { limit }),
      searchUsers(query, { limit }),
    ]);

    return {
      products: productsResult.hits,
      shops: shopsResult.hits,
      users: usersResult.hits,
    };
  } catch (error) {
    console.error('Search error:', error);
    return { products: [], shops: [], users: [] };
  }
}

/**
 * Obtenir des suggestions de recherche
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 10
): Promise<string[]> {
  if (!searchClient || !query.trim()) {
    return [];
  }

  try {
    const result = await searchProducts(query, { limit });

    // Extraire les termes uniques pour les suggestions
    const suggestions = new Set<string>();
    result.hits.forEach((hit: ProductSearchResult) => {
      suggestions.add(hit.name);
      if (hit.category_name) suggestions.add(hit.category_name);
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
}

/**
 * Construire les filtres pour la recherche de produits
 */
export function buildProductFilters(options: {
  categoryId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  isFeatured?: boolean;
}): string {
  const filters: string[] = [];

  if (options.categoryId) {
    filters.push(`category_id = "${options.categoryId}"`);
  }
  if (options.shopId) {
    filters.push(`shop_id = "${options.shopId}"`);
  }
  if (options.minPrice !== undefined) {
    filters.push(`price >= ${options.minPrice}`);
  }
  if (options.maxPrice !== undefined) {
    filters.push(`price <= ${options.maxPrice}`);
  }
  if (options.inStock) {
    filters.push(`stock > 0`);
  }
  if (options.minRating !== undefined) {
    filters.push(`rating >= ${options.minRating}`);
  }
  if (options.isFeatured) {
    filters.push(`is_featured = true`);
  }

  return filters.join(' AND ');
}

/**
 * Options de tri disponibles
 */
export const SORT_OPTIONS = {
  RELEVANCE: [], // Tri par défaut de Meilisearch
  PRICE_ASC: ['price:asc'],
  PRICE_DESC: ['price:desc'],
  RATING_DESC: ['rating:desc'],
  NEWEST: ['created_at:desc'],
  POPULARITY: ['views_count:desc'],
} as const;

/**
 * Recherche avec autocomplétion
 */
export async function autocomplete(
  query: string,
  limit: number = 5
): Promise<{
  products: Array<{ id: string; name: string; price: number }>;
  categories: Array<{ id: string; name: string }>;
}> {
  if (!searchClient || !query.trim()) {
    return { products: [], categories: [] };
  }

  try {
    const productsResult = await searchProducts(query, { limit });

    return {
      products: productsResult.hits.map((hit: ProductSearchResult) => ({
        id: hit.id,
        name: hit.name,
        price: hit.price,
      })),
      categories: [], // À implémenter si nécessaire
    };
  } catch (error) {
    console.error('Autocomplete error:', error);
    return { products: [], categories: [] };
  }
}
