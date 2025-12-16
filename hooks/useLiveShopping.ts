import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveSession {
  id: string;
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  viewer_count: number;
  peak_viewer_count: number;
  total_views: number;
  total_sales: number;
  total_orders: number;
  playback_url?: string;
  chat_enabled: boolean;
  created_at: string;
}

export interface LiveChatMessage {
  id: string;
  live_session_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  message: string;
  message_type: 'text' | 'reaction' | 'system' | 'product_highlight';
  product_id?: string;
  is_pinned: boolean;
  created_at: string;
}

export interface LiveReaction {
  id: string;
  user_id: string;
  reaction_type: 'heart' | 'fire' | 'clap' | 'star' | 'cart';
  created_at: string;
}

export interface LiveFeaturedProduct {
  id: string;
  product_id: string;
  product_title?: string;
  product_image?: string;
  product_price?: number;
  special_price?: number;
  stock_limit?: number;
  sold_count: number;
  is_active: boolean;
}

/**
 * Hook principal pour gérer les sessions live
 */
export function useLiveShopping(sessionId?: string) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('live_sessions')
        .select(`
          *,
          profiles!seller_id (
            shop_name,
            avatar_url
          )
        `)
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      setSession({
        ...data,
        seller_name: data.profiles?.shop_name,
        seller_avatar: data.profiles?.avatar_url,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching live session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const startSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.rpc('start_live_session', {
        session_id: sessionId
      });

      if (error) throw error;
      await fetchSession();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.rpc('end_live_session', {
        session_id: sessionId
      });

      if (error) throw error;
      await fetchSession();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, fetchSession]);

  return {
    session,
    isLoading,
    error,
    refreshSession: fetchSession,
    startSession,
    endSession,
  };
}

/**
 * Hook pour gérer le chat en temps réel
 */
export function useLiveChat(sessionId: string) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select(`
          *,
          profiles!user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('live_session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const formattedMessages = (data || []).map((msg: any) => ({
        ...msg,
        user_name: msg.profiles?.full_name || 'Anonyme',
        user_avatar: msg.profiles?.avatar_url,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const sendMessage = async (message: string, messageType: string = 'text', productId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .insert({
          live_session_id: sessionId,
          user_id: user.id,
          message,
          message_type: messageType,
          product_id: productId,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchMessages();

    // S'abonner aux nouveaux messages
    channelRef.current = supabase
      .channel(`live-chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Récupérer les infos utilisateur
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: LiveChatMessage = {
            ...payload.new as any,
            user_name: profile?.full_name || 'Anonyme',
            user_avatar: profile?.avatar_url,
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, fetchMessages]);

  return {
    messages,
    isLoading,
    sendMessage,
    refreshMessages: fetchMessages,
  };
}

/**
 * Hook pour gérer les réactions en temps réel
 */
export function useLiveReactions(sessionId: string) {
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const sendReaction = async (reactionType: LiveReaction['reaction_type']) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('live_reactions')
        .insert({
          live_session_id: sessionId,
          user_id: user.id,
          reaction_type: reactionType,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending reaction:', error);
      throw error;
    }
  };

  useEffect(() => {
    // S'abonner aux nouvelles réactions
    channelRef.current = supabase
      .channel(`live-reactions:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_reactions',
          filter: `live_session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newReaction = payload.new as LiveReaction;
          setReactions((prev) => [...prev, newReaction]);

          // Retirer la réaction après animation
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId]);

  return {
    reactions,
    sendReaction,
  };
}

/**
 * Hook pour gérer les spectateurs
 */
export function useLiveViewers(sessionId: string, autoJoin: boolean = true) {
  const [viewerCount, setViewerCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const joinLive = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.rpc('record_live_view', {
        session_id: sessionId,
        viewer_user_id: user.id
      });
    } catch (error) {
      console.error('Error joining live:', error);
    }
  }, [sessionId]);

  const updateViewerCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('update_viewer_count', {
        session_id: sessionId
      });

      if (!error && data !== null) {
        setViewerCount(data);
      }
    } catch (error) {
      console.error('Error updating viewer count:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (autoJoin) {
      joinLive();
    }

    // Mettre à jour le compteur toutes les 10 secondes
    updateViewerCount();
    intervalRef.current = setInterval(updateViewerCount, 10000);

    // Heartbeat toutes les 20 secondes
    const heartbeatInterval = setInterval(joinLive, 20000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(heartbeatInterval);
    };
  }, [sessionId, autoJoin, joinLive, updateViewerCount]);

  return {
    viewerCount,
    joinLive,
  };
}

/**
 * Hook pour gérer les produits en vedette
 */
export function useLiveFeaturedProducts(sessionId: string) {
  const [products, setProducts] = useState<LiveFeaturedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_featured_products')
        .select(`
          *,
          products!product_id (
            title,
            images,
            price
          )
        `)
        .eq('live_session_id', sessionId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedProducts = (data || []).map((item: any) => ({
        ...item,
        product_title: item.products?.title,
        product_image: item.products?.images?.[0],
        product_price: item.products?.price,
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    refreshProducts: fetchProducts,
  };
}

/**
 * Hook pour obtenir les lives actifs
 */
export function useActiveLiveSessions(limit: number = 20) {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_active_live_sessions', {
        limit_count: limit
      });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSessions();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchSessions, 30000);

    return () => clearInterval(interval);
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    refresh: fetchSessions,
  };
}
