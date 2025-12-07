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

  // Fallback pour le chargement des produits - Simple et fiable
  const fetchProductsFallback = async (reset: boolean, currentOffset: number) => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0); // Exclure les produits en rupture de stock (stock = 0)

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Appliquer le tri selon l'option
      switch (sortOption) {
        case 'popular':
        case 'trending':
        case 'smart':
        default:
          // Tri par défaut : plus récents en premier
          query = query.order('created_at', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('created_at', { ascending: false }); // Fallback si average_rating n'existe pas
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
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

  // Récupérer les produits - Utilise directement fetchProductsFallback
  const fetchProducts = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      }

      const currentOffset = reset ? 0 : offset;

      // Utiliser directement le fallback (requête simple et fiable)
      await fetchProductsFallback(reset, currentOffset);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId, limit, offset, sortOption]);

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

  // Enregistrer une interaction - Version simplifiée sans RPC
  const recordInteraction = useCallback(async (
    productId: string,
    interactionType: string,
    source = 'home'
  ) => {
    try {
      // Log simple pour le tracking (peut être étendu plus tard)
      console.log('📊 Interaction:', interactionType, productId, 'from:', source);
      // TODO: Implémenter le tracking d'interactions si nécessaire
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
