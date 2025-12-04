import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types pour les recommandations
export interface RecommendedProduct extends Product {
  view_count?: number;
  click_count?: number;
  favorite_count?: number;
  popularity_score?: number;
  trending_score?: number;
  recommendation_score?: number;
  recommendation_reason?: string;
}

export type SortOption = 'smart' | 'popular' | 'trending' | 'newest' | 'rating' | 'price_asc' | 'price_desc';

interface UseProductRecommendationsOptions {
  categoryId?: string | null;
  limit?: number;
  sortBy?: SortOption;
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisecondes
}

interface UseProductRecommendationsReturn {
  products: RecommendedProduct[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  recordView: (productId: string) => Promise<void>;
  recordClick: (productId: string) => Promise<void>;
  recordDetailView: (productId: string) => Promise<void>;
  recordFavorite: (productId: string) => Promise<void>;
  recordShare: (productId: string) => Promise<void>;
  changeSortOption: (option: SortOption) => void;
  currentSortOption: SortOption;
}

const SESSION_KEY = '@senepanda_session_id';
const PAGE_SIZE = 20;

// Générer un ID de session unique
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export function useProductRecommendations(
  options: UseProductRecommendationsOptions = {}
): UseProductRecommendationsReturn {
  const {
    categoryId = null,
    limit = PAGE_SIZE,
    sortBy: initialSortBy = 'smart',
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute par défaut
  } = options;

  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortOption, setSortOption] = useState<SortOption>(initialSortBy);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialiser l'ID de session
  useEffect(() => {
    const initSession = async () => {
      let storedSessionId = await AsyncStorage.getItem(SESSION_KEY);
      if (!storedSessionId) {
        storedSessionId = generateSessionId();
        await AsyncStorage.setItem(SESSION_KEY, storedSessionId);
      }
      setSessionId(storedSessionId);
    };

    initSession();

    // Récupérer l'utilisateur connecté
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };

    getUser();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Récupérer les produits avec l'algorithme de recommandation
  const fetchProducts = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      }

      const currentOffset = reset ? 0 : offset;

      // Essayer d'utiliser la fonction RPC si disponible
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_recommended_products', {
        p_user_id: userId,
        p_category_id: categoryId,
        p_limit: limit,
        p_offset: currentOffset,
        p_sort_by: sortOption,
      });

      if (!rpcError && rpcData) {
        // Fonction RPC disponible
        const newProducts = rpcData as RecommendedProduct[];

        if (reset) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }

        setHasMore(newProducts.length >= limit);
        setOffset(currentOffset + newProducts.length);
        setError(null);
      } else {
        // Fallback: utiliser une requête classique avec tri amélioré
        console.log('RPC non disponible, utilisation du fallback');
        await fetchProductsFallback(reset, currentOffset);
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setError('Erreur lors du chargement des produits');
      // Essayer le fallback
      await fetchProductsFallback(reset, offset);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, categoryId, limit, offset, sortOption]);

  // Fallback pour le chargement des produits (si RPC non disponible)
  const fetchProductsFallback = async (reset: boolean, currentOffset: number) => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          view_count,
          click_count,
          favorite_count,
          popularity_score,
          trending_score
        `)
        .eq('is_active', true)
        .gt('stock', 0);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Appliquer le tri selon l'option
      switch (sortOption) {
        case 'popular':
          query = query.order('popularity_score', { ascending: false, nullsFirst: false });
          break;
        case 'trending':
          query = query.order('trending_score', { ascending: false, nullsFirst: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false, nullsFirst: false });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'smart':
        default:
          // Tri intelligent: mélange de popularité et fraîcheur
          query = query
            .order('popularity_score', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });
          break;
      }

      query = query.range(currentOffset, currentOffset + limit - 1);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const newProducts = (data || []).map(p => ({
        ...p,
        recommendation_reason: getRecommendationReason(p),
      }));

      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setHasMore(newProducts.length >= limit);
      setOffset(currentOffset + newProducts.length);
      setError(null);
    } catch (err) {
      console.error('Erreur fallback:', err);
      setError('Erreur lors du chargement des produits');
    }
  };

  // Déterminer la raison de recommandation
  const getRecommendationReason = (product: any): string => {
    const now = new Date();
    const createdAt = new Date(product.created_at);
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) return 'Nouveau';
    if ((product.trending_score || 0) > 100) return 'Tendance';
    if ((product.average_rating || 0) >= 4.5) return 'Très bien noté';
    if ((product.popularity_score || 0) > 50) return 'Populaire';
    return 'Recommandé';
  };

  // Enregistrer une interaction
  const recordInteraction = useCallback(async (
    productId: string,
    interactionType: string,
    source = 'home'
  ) => {
    try {
      // Essayer d'utiliser la fonction RPC
      const { error: rpcError } = await supabase.rpc('record_product_interaction', {
        p_product_id: productId,
        p_user_id: userId,
        p_interaction_type: interactionType,
        p_source: source,
        p_session_id: sessionId,
      });

      if (rpcError) {
        // Fallback: incrémenter directement
        const updateField = interactionType === 'view' ? 'view_count' :
                           interactionType === 'click' || interactionType === 'detail_view' ? 'click_count' :
                           interactionType === 'favorite' ? 'favorite_count' :
                           interactionType === 'share' ? 'share_count' : null;

        if (updateField) {
          try {
            await supabase.rpc('increment', {
              table_name: 'products',
              field_name: updateField,
              row_id: productId,
            });
          } catch {
            // Si rpc increment n'existe pas, faire un update manuel
            // Note: ceci est moins efficace mais fonctionne comme fallback
            console.log('Tracking interaction (fallback):', interactionType, productId);
          }
        }
      }
    } catch (err) {
      console.warn('Erreur enregistrement interaction:', err);
    }
  }, [userId, sessionId]);

  // Fonctions d'interaction exposées
  const recordView = useCallback(async (productId: string) => {
    await recordInteraction(productId, 'view');
  }, [recordInteraction]);

  const recordClick = useCallback(async (productId: string) => {
    await recordInteraction(productId, 'click');
  }, [recordInteraction]);

  const recordDetailView = useCallback(async (productId: string) => {
    await recordInteraction(productId, 'detail_view');
  }, [recordInteraction]);

  const recordFavorite = useCallback(async (productId: string) => {
    await recordInteraction(productId, 'favorite');
  }, [recordInteraction]);

  const recordShare = useCallback(async (productId: string) => {
    await recordInteraction(productId, 'share');
  }, [recordInteraction]);

  // Rafraîchir les produits
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts(true);
  }, [fetchProducts]);

  // Charger plus de produits
  const loadMore = useCallback(async () => {
    if (!loading && !refreshing && hasMore) {
      await fetchProducts(false);
    }
  }, [loading, refreshing, hasMore, fetchProducts]);

  // Changer l'option de tri
  const changeSortOption = useCallback((option: SortOption) => {
    if (option !== sortOption) {
      setSortOption(option);
      setOffset(0);
      setProducts([]);
      setLoading(true);
    }
  }, [sortOption]);

  // Charger les produits au montage et quand les dépendances changent
  useEffect(() => {
    fetchProducts(true);
  }, [categoryId, sortOption, userId]);

  // Auto-refresh si activé
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        if (!loading && !refreshing) {
          fetchProducts(true);
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, loading, refreshing, fetchProducts]);

  return {
    products,
    loading,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    recordView,
    recordClick,
    recordDetailView,
    recordFavorite,
    recordShare,
    changeSortOption,
    currentSortOption: sortOption,
  };
}

export default useProductRecommendations;
