import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProductViewStats {
  totalViews: number;
  rank: number;
}

/**
 * Hook pour gérer les vues des produits
 */
export function useProductViews(productId: string | null) {
  const [viewStats, setViewStats] = useState<ProductViewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Fonction pour incrémenter le compteur de vues
  const incrementViews = async () => {
    if (!productId || hasTrackedView) return;

    try {
      const { data, error } = await supabase.rpc('increment_product_views', {
        product_id: productId
      });

      if (error) {
        console.error('Erreur lors de l\'incrémentation des vues:', error);
        return;
      }

      setHasTrackedView(true);

      // Mettre à jour les stats après l'incrémentation
      fetchViewStats();
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation des vues:', error);
    }
  };

  // Fonction pour récupérer les statistiques de vues
  const fetchViewStats = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_product_view_stats', {
        product_id: productId
      });

      if (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        return;
      }

      if (data && data.length > 0) {
        setViewStats({
          totalViews: data[0].total_views || 0,
          rank: data[0].rank || 0
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les stats au chargement
  useEffect(() => {
    if (productId) {
      fetchViewStats();
    }
  }, [productId]);

  return {
    viewStats,
    isLoading,
    incrementViews,
    hasTrackedView
  };
}

/**
 * Hook pour récupérer les produits tendance (les plus vus)
 */
export function useTrendingProducts(limit: number = 10) {
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrendingProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_trending_products', {
        limit_count: limit
      });

      if (error) {
        console.error('Erreur lors de la récupération des produits tendance:', error);
        return;
      }

      setTrendingProducts(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des produits tendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingProducts();
  }, [limit]);

  return {
    trendingProducts,
    isLoading,
    refresh: fetchTrendingProducts
  };
}
