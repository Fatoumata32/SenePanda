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
  user_avatar?: string | null;
  message: string;
  message_type: 'text' | 'reaction' | 'system' | 'product_highlight';
  product_id?: string | null;
  is_pinned?: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
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
  const channelRef = useRef<RealtimeChannel | null>(null);

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

      const sessionData = {
        ...data,
        seller_name: data.profiles?.shop_name,
        seller_avatar: data.profiles?.avatar_url,
      };

      console.log('✅ Session chargée:', sessionData.id, 'Statut:', sessionData.status);
      setSession(sessionData);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error fetching live session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const startSession = async (sessionId: string) => {
    try {
      console.log('🚀 Démarrage du live session:', sessionId);

      // Mise à jour directe du statut (contournement du bug RPC)
      const { data: updatedData, error: updateError } = await supabase
        .from('live_sessions')
        .update({
          status: 'live',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select(`
          *,
          profiles!seller_id (
            shop_name,
            avatar_url
          )
        `)
        .single();

      if (updateError) {
        console.error('❌ Erreur mise à jour session:', updateError);
        throw updateError;
      }

      console.log('✅ Session mise à jour à LIVE:', updatedData?.status);

      // Mettre à jour directement l'état local avec les données retournées
      if (updatedData) {
        const sessionData = {
          ...updatedData,
          seller_name: updatedData.profiles?.shop_name,
          seller_avatar: updatedData.profiles?.avatar_url,
        };
        setSession(sessionData as any);
        console.log('✅ Session state local mis à jour:', sessionData.status);
      }

      // Attendre 500ms pour que la BDD se synchronise
      await new Promise(resolve => setTimeout(resolve, 500));

      // Rafraîchir depuis la BDD
      await fetchSession();
    } catch (err: any) {
      console.error('❌ Erreur dans startSession:', err.message);
      setError(err.message);
      throw err;
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      // Mise à jour directe au lieu d'utiliser RPC
      const { error } = await supabase
        .from('live_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      await fetchSession();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    fetchSession();

    // S'abonner aux changements de statut de la session avec un nom unique
    const channelName = `live-session-hook-${sessionId}-${Date.now()}`;
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          // Vérifier que c'est bien la session qu'on attend
          if ((payload.new as any).id !== sessionId) {
            console.log('⚠️ [HOOK] Reçu update d\'une autre session, ignoré:', (payload.new as any).id);
            return;
          }
          
          console.log('📡 Session mise à jour:', payload.new);
          // Mettre à jour la session avec les nouvelles données
          const { data: profile } = await supabase
            .from('profiles')
            .select('shop_name, avatar_url')
            .eq('id', (payload.new as any).seller_id)
            .single();

          setSession({
            ...(payload.new as any),
            seller_name: profile?.shop_name,
            seller_avatar: profile?.avatar_url,
          });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
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
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedMessages = (data || []).map((msg: any) => ({
        ...msg,
        user_name: msg.profiles?.full_name || 'Anonyme',
        user_avatar: msg.profiles?.avatar_url,
      })).reverse(); // Inverser pour avoir l'ordre chronologique

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

    // Ajouter le message de manière optimiste (avant la confirmation serveur)
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: LiveChatMessage = {
      id: tempId,
      live_session_id: sessionId,
      user_id: user.id,
      message,
      message_type: (messageType as LiveChatMessage['message_type']) || 'text',
      product_id: productId || null,
      user_name: 'Vous', // Sera remplacé par le vrai nom
      user_avatar: null,
      is_deleted: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Ajouter immédiatement le message optimiste à la liste
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .insert({
          live_session_id: sessionId,
          user_id: user.id,
          message,
          message_type: messageType,
          product_id: productId,
        })
        .select()
        .single();

      if (error) throw error;

      // Remplacer le message optimiste par le message réel
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...optimisticMessage, id: data.id } : msg))
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Retirer le message optimiste en cas d'erreur
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      throw error;
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    fetchMessages();

    // S'abonner aux nouveaux messages
    console.log(`💬 [useLiveChat] Abonnement au canal live-chat:${sessionId}`);
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
          console.log('💬 [useLiveChat] Nouveau message reçu:', payload.new);

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

          console.log('💬 [useLiveChat] Message formaté:', newMessage);

          setMessages((prev) => {
            // Éviter les doublons
            if (prev.find(m => m.id === newMessage.id)) {
              console.log('⚠️ [useLiveChat] Message dupliqué ignoré:', newMessage.id);
              return prev;
            }
            // Limiter à 50 messages pour les performances
            const updated = [...prev, newMessage];
            console.log(`✅ [useLiveChat] Messages mis à jour: ${updated.length} messages`);
            return updated.slice(-50);
          });
        }
      )
      .subscribe((status) => {
        console.log(`📡 [useLiveChat] Statut du canal:`, status);
      });

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
    if (!sessionId) return;

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
      // Enregistrer ou mettre à jour la vue
      await supabase
        .from('live_viewers')
        .upsert({
          live_session_id: sessionId,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        }, {
          onConflict: 'live_session_id,user_id'
        });
    } catch (error) {
      console.error('Error joining live:', error);
    }
  }, [sessionId]);

  const updateViewerCount = useCallback(async () => {
    try {
      // Compter les spectateurs actifs (dans les 30 dernières secondes)
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

      const { count, error } = await supabase
        .from('live_viewers')
        .select('*', { count: 'exact', head: true })
        .eq('live_session_id', sessionId)
        .gte('joined_at', thirtySecondsAgo)
        .is('left_at', null);

      if (!error && count !== null) {
        setViewerCount(count);
      }
    } catch (error) {
      console.error('Error updating viewer count:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

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
  const channelRef = useRef<RealtimeChannel | null>(null);

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

      console.log(`🛍️ [useLiveFeaturedProducts] Produits chargés: ${formattedProducts.length} produits`);
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    fetchProducts();

    // S'abonner aux changements sur les produits en vedette
    console.log(`🛍️ [useLiveFeaturedProducts] Abonnement aux produits du live: ${sessionId}`);
    channelRef.current = supabase
      .channel(`live-products:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_featured_products',
          filter: `live_session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('🛍️ [useLiveFeaturedProducts] Produit mis à jour:', payload.new);
          // Recharger tous les produits pour avoir les dernières données
          await fetchProducts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_featured_products',
          filter: `live_session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('🛍️ [useLiveFeaturedProducts] Nouveau produit ajouté:', payload.new);
          await fetchProducts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'live_featured_products',
          filter: `live_session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('🛍️ [useLiveFeaturedProducts] Produit retiré:', payload.old);
          await fetchProducts();
        }
      )
      .subscribe((status) => {
        console.log(`📡 [useLiveFeaturedProducts] Statut du canal:`, status);
      });

    // S'abonner aussi aux changements dans la table products pour détecter les mises à jour de prix
    // On doit d'abord récupérer les IDs des produits concernés
    const setupProductsSubscription = async () => {
      const { data: featuredProducts } = await supabase
        .from('live_featured_products')
        .select('product_id')
        .eq('live_session_id', sessionId)
        .eq('is_active', true);

      if (featuredProducts && featuredProducts.length > 0) {
        const productIds = featuredProducts.map(p => p.product_id);
        console.log(`🛍️ [useLiveFeaturedProducts] Abonnement aux produits IDs:`, productIds);

        // S'abonner aux changements sur ces produits spécifiques
        const productsChannel = supabase
          .channel(`live-products-data:${sessionId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'products',
            },
            async (payload) => {
              // Vérifier si le produit mis à jour fait partie des produits en vedette
              if (productIds.includes(payload.new.id)) {
                console.log('💰 [useLiveFeaturedProducts] Prix produit mis à jour:', payload.new);
                console.log('💰 Nouveau prix:', payload.new.price);
                // Recharger tous les produits pour afficher le nouveau prix
                await fetchProducts();
              }
            }
          )
          .subscribe((status) => {
            console.log(`📡 [useLiveFeaturedProducts] Statut canal produits:`, status);
          });

        return productsChannel;
      }
    };

    setupProductsSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, fetchProducts]);

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
      console.log('🔍 [useLiveShopping] Début fetch sessions, client Supabase:', supabase ? 'Initialisé' : 'Non initialisé');

      // Requête directe au lieu d'utiliser une fonction RPC qui n'existe peut-être pas
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          profiles!seller_id (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'live')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [useLiveShopping] Erreur Supabase:', error);
        throw error;
      }

      const formattedSessions = (data || []).map((session: any) => ({
        ...session,
        seller_name: session.profiles?.full_name || 'Vendeur',
        seller_avatar: session.profiles?.avatar_url,
        viewer_count: session.viewers_count || 0,
        peak_viewer_count: session.max_viewers || 0,
        total_views: session.viewers_count || 0,
        total_sales: session.total_sales || 0,
        total_orders: 0,
        chat_enabled: true,
      }));

      setSessions(formattedSessions);
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
