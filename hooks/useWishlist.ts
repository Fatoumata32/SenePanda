/**
 * Hook pour gérer la wishlist (liste de souhaits)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { logger } from '../lib/logger';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    image_url: string;
    stock: number;
    is_active: boolean;
    seller_id: string;
  };
}

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data || []);
      setCount(data?.length || 0);
    } catch (error) {
      logger.error('Failed to fetch wishlist', error as Error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const refreshWishlist = useCallback(async () => {
    setRefreshing(true);
    await fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!user?.id) {
        logger.warn('User not authenticated');
        return false;
      }

      try {
        const { data, error } = await supabase.rpc('toggle_wishlist', {
          p_product_id: productId,
        });

        if (error) throw error;

        logger.info('Wishlist toggled', {
          productId,
          action: data.action,
        });

        // Mettre à jour la liste
        await fetchWishlist();

        return data.action === 'added';
      } catch (error) {
        logger.error('Failed to toggle wishlist', error as Error);
        return false;
      }
    },
    [user?.id, fetchWishlist]
  );

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return items.some((item) => item.product_id === productId);
    },
    [items]
  );

  const removeFromWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        logger.info('Removed from wishlist', { productId });

        await fetchWishlist();
        return true;
      } catch (error) {
        logger.error('Failed to remove from wishlist', error as Error);
        return false;
      }
    },
    [user?.id, fetchWishlist]
  );

  const clearWishlist = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      logger.info('Wishlist cleared');

      setItems([]);
      setCount(0);
      return true;
    } catch (error) {
      logger.error('Failed to clear wishlist', error as Error);
      return false;
    }
  }, [user?.id]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('wishlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlists',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchWishlist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchWishlist]);

  // Initial fetch
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return {
    items,
    count,
    loading,
    refreshing,
    refreshWishlist,
    toggleWishlist,
    isInWishlist,
    removeFromWishlist,
    clearWishlist,
  };
}
