import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderTrackingEvent {
  id: string;
  order_id: string;
  status: OrderStatus;
  message: string;
  location?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: any[];
}

export function useOrderTracking(orderId?: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<OrderTrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Fetch order details
  const fetchOrder = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            product:products (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      setOrder(data);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Erreur lors du chargement de la commande');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch tracking events
  const fetchTrackingEvents = useCallback(async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('order_tracking_events')
        .select('*')
        .eq('order_id', id)
        .order('timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      setTrackingEvents(data || []);
    } catch (err: any) {
      console.error('Error fetching tracking events:', err);
    }
  }, []);

  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback((id: string) => {
    const channel = supabase
      .channel(`order:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setOrder(current => ({
            ...current,
            ...payload.new,
          } as Order));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_tracking_events',
          filter: `order_id=eq.${id}`,
        },
        (payload) => {
          setTrackingEvents(current => [
            payload.new as OrderTrackingEvent,
            ...current,
          ]);
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initialize
  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
      fetchTrackingEvents(orderId);
      const unsubscribe = subscribeToUpdates(orderId);

      return () => {
        unsubscribe();
      };
    }
  }, [orderId, fetchOrder, fetchTrackingEvents, subscribeToUpdates]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [realtimeChannel]);

  // Add tracking event (for sellers/admins)
  const addTrackingEvent = useCallback(async (
    status: OrderStatus,
    message: string,
    location?: string,
    metadata?: Record<string, any>
  ) => {
    if (!orderId) return;

    try {
      const { error: insertError } = await supabase
        .from('order_tracking_events')
        .insert({
          order_id: orderId,
          status,
          message,
          location,
          metadata,
          timestamp: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error('Error adding tracking event:', err);
      setError(err.message || 'Erreur lors de l\'ajout de l\'événement');
      return false;
    }
  }, [orderId]);

  // Cancel order
  const cancelOrder = useCallback(async (reason?: string) => {
    if (!orderId) return false;

    try {
      const success = await addTrackingEvent(
        'cancelled',
        reason || 'Commande annulée par l\'utilisateur'
      );

      return success;
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      return false;
    }
  }, [orderId, addTrackingEvent]);

  // Get current status info
  const getCurrentStatusInfo = useCallback(() => {
    if (!order) return null;

    const statusInfo: Record<OrderStatus, { label: string; color: string; icon: string }> = {
      pending: { label: 'En attente', color: '#FFA500', icon: 'clock' },
      confirmed: { label: 'Confirmée', color: '#4CAF50', icon: 'check-circle' },
      processing: { label: 'En préparation', color: '#2196F3', icon: 'package' },
      shipped: { label: 'Expédiée', color: '#9C27B0', icon: 'truck' },
      out_for_delivery: { label: 'En livraison', color: '#FF9800', icon: 'navigation' },
      delivered: { label: 'Livrée', color: '#4CAF50', icon: 'check-circle-2' },
      cancelled: { label: 'Annulée', color: '#F44336', icon: 'x-circle' },
      refunded: { label: 'Remboursée', color: '#607D8B', icon: 'refund' },
    };

    return statusInfo[order.status] || statusInfo.pending;
  }, [order]);

  // Get progress percentage
  const getProgressPercentage = useCallback(() => {
    if (!order) return 0;

    const statusOrder: OrderStatus[] = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
    ];

    const currentIndex = statusOrder.indexOf(order.status);
    if (currentIndex === -1) return 0;

    return ((currentIndex + 1) / statusOrder.length) * 100;
  }, [order]);

  // Check if order can be cancelled
  const canCancel = useCallback(() => {
    if (!order) return false;
    return ['pending', 'confirmed', 'processing'].includes(order.status);
  }, [order]);

  // Refresh data
  const refresh = useCallback(async () => {
    if (orderId) {
      await Promise.all([
        fetchOrder(orderId),
        fetchTrackingEvents(orderId),
      ]);
    }
  }, [orderId, fetchOrder, fetchTrackingEvents]);

  return {
    order,
    trackingEvents,
    isLoading,
    error,
    addTrackingEvent,
    cancelOrder,
    getCurrentStatusInfo,
    getProgressPercentage,
    canCancel,
    refresh,
  };
}

export default useOrderTracking;
