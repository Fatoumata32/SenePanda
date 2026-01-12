/**
 * Hook pour gérer les commandes utilisateur
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { logger } from '../lib/logger';

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: {
    id: string;
    title: string;
    image_url: string;
  };
}

export interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  phone: string;
  notes?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
  seller?: {
    id: string;
    full_name: string;
    shop_name: string;
  };
}

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      logger.warn('useOrders: No user ID');
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      logger.debug('Fetching orders for user', { userId: user.id });

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(id, title, image_url)
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch orders', error);
        throw error;
      }

      setOrders(data || []);
      logger.info(`Fetched ${data?.length || 0} orders`);
    } catch (error) {
      logger.error('Error in fetchOrders', error as Error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const refreshOrders = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
  }, [fetchOrders]);

  const getOrderById = useCallback(
    async (orderId: string): Promise<Order | null> => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(
              *,
              product:products(id, title, image_url)
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        logger.error('Error getting order by ID', error as Error);
        return null;
      }
    },
    []
  );

  const cancelOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .eq('buyer_id', user?.id);

        if (error) throw error;

        logger.info('Order cancelled', { orderId });
        await fetchOrders();
        return true;
      } catch (error) {
        logger.error('Failed to cancel order', error as Error);
        return false;
      }
    },
    [user?.id, fetchOrders]
  );

  // Subscribe to real-time order updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${user.id}`,
        },
        (payload) => {
          logger.debug('Order updated via realtime', { payload });
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders by status
  const getOrdersByStatus = useCallback(
    (status: Order['status']) => {
      return orders.filter((order) => order.status === status);
    },
    [orders]
  );

  // Get order statistics
  const getOrderStats = useCallback(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  return {
    orders,
    loading,
    refreshing,
    refreshOrders,
    getOrderById,
    cancelOrder,
    getOrdersByStatus,
    getOrderStats,
  };
}
