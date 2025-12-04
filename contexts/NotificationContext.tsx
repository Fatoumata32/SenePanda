import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIDDEN_NOTIFICATIONS_KEY = '@senepanda_hidden_notifications';

interface NotificationContextType {
  unreadCount: number;
  refreshCount: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  decrementCount: (amount?: number) => void;
  hideNotification: (id: string) => Promise<void>;
  hiddenIds: string[];
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshCount: async () => {},
  markAllAsRead: async () => {},
  decrementCount: () => {},
  hideNotification: async () => {},
  hiddenIds: [],
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const channelRef = useRef<any>(null);

  // Charger les IDs masqués au démarrage
  useEffect(() => {
    loadHiddenIds();
  }, []);

  const loadHiddenIds = async () => {
    try {
      const stored = await AsyncStorage.getItem(HIDDEN_NOTIFICATIONS_KEY);
      if (stored) {
        setHiddenIds(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Error loading hidden notifications:', error);
    }
  };

  // Masquer une notification (pour les notifications générées dynamiquement)
  const hideNotification = useCallback(async (id: string) => {
    try {
      const newHiddenIds = [...hiddenIds, id];
      setHiddenIds(newHiddenIds);
      await AsyncStorage.setItem(HIDDEN_NOTIFICATIONS_KEY, JSON.stringify(newHiddenIds));
      console.log('🙈 Notification masquée:', id);
    } catch (error) {
      console.error('Error hiding notification:', error);
    }
  }, [hiddenIds]);

  // Récupérer le nombre de notifications non lues
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setUnreadCount(0);
        setUserId(null);
        return;
      }

      setUserId(user.id);
      let count = 0;

      // 1. Notifications non lues (table notifications)
      try {
        const { count: notifCount, error: notifError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (!notifError && notifCount !== null) {
          count += notifCount;
        }
      } catch (err) {
        // Table peut ne pas exister, ignorer
      }

      // 2. Deal notifications non lues
      try {
        const { count: dealCount, error: dealError } = await supabase
          .from('deal_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (!dealError && dealCount !== null) {
          count += dealCount;
        }
      } catch (err) {
        // Table peut ne pas exister, ignorer
      }

      // 3. Messages non lus
      try {
        const { count: msgCount, error: msgError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false);

        if (!msgError && msgCount !== null) {
          count += msgCount;
        }
      } catch (err) {
        // Table peut ne pas exister, ignorer
      }

      // 4. Compter les commandes récentes (dernières 24h) non vues
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: recentOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .gte('updated_at', yesterday.toISOString());

        if (recentOrders) {
          // Ne compter que les commandes non masquées
          const visibleOrders = recentOrders.filter(o => !hiddenIds.includes(`order-${o.id}`));
          count += visibleOrders.length;
        }
      } catch (err) {
        // Table peut ne pas exister, ignorer
      }

      // 5. Compter les transactions de points récentes (dernières 24h) non vues
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: recentPoints } = await supabase
          .from('points_transactions')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', yesterday.toISOString());

        if (recentPoints) {
          // Ne compter que les transactions non masquées
          const visiblePoints = recentPoints.filter(p => !hiddenIds.includes(`points-${p.id}`));
          count += visiblePoints.length;
        }
      } catch (err) {
        // Table peut ne pas exister, ignorer
      }

      console.log('🔔 [NotificationContext] Total non lues:', count);
      setUnreadCount(count);
    } catch (error) {
      console.warn('⚠️ [NotificationContext] Erreur:', error);
      setUnreadCount(0);
    }
  }, [hiddenIds]);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      // Marquer notifications
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      // Marquer deal_notifications
      await supabase
        .from('deal_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      setUnreadCount(0);
      console.log('✅ [NotificationContext] Toutes marquées comme lues');
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
    }
  }, [userId]);

  // Décrémenter le compteur
  const decrementCount = useCallback((amount: number = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount));
  }, []);

  // Setup realtime listener
  useEffect(() => {
    fetchUnreadCount();

    const setupRealtimeListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Créer un canal unique pour écouter les changements
      const channel = supabase
        .channel(`notif-context-${user.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('🔄 [NotificationContext] Changement notifications détecté');
            fetchUnreadCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deal_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('🔄 [NotificationContext] Changement deal_notifications détecté');
            fetchUnreadCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            console.log('🔄 [NotificationContext] Nouveau message détecté');
            fetchUnreadCount();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ [NotificationContext] Écoute temps réel activée');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('⚠️ [NotificationContext] Realtime non disponible, mode polling');
          }
        });

      channelRef.current = channel;
    };

    setupRealtimeListener();

    // Écouter les changements d'état de l'app
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        fetchUnreadCount();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          fetchUnreadCount();
        } else if (event === 'SIGNED_OUT') {
          setUnreadCount(0);
          setUserId(null);
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        }
      }
    );

    return () => {
      appStateSub.remove();
      subscription.unsubscribe();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchUnreadCount]);

  // Polling fallback toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshCount: fetchUnreadCount,
        markAllAsRead,
        decrementCount,
        hideNotification,
        hiddenIds,
      }}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
