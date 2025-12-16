import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface LiveNotification {
  id: string;
  type: 'live_started' | 'product_live' | 'live_ended';
  title: string;
  message: string;
  data: {
    session_id?: string;
    seller_id?: string;
    seller_name?: string;
    live_title?: string;
    product_id?: string;
    product_title?: string;
    special_price?: number;
  };
  read: boolean;
  created_at: string;
}

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Hook pour gérer les notifications Live Shopping
 */
export function useLiveNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Charger les notifications au démarrage
  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  // Charger les notifications depuis la base de données
  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_user_id: user.id,
        p_limit: 50,
      });

      if (error) throw error;

      setNotifications(data || []);
      const unread = (data || []).filter((n: LiveNotification) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // S'abonner aux nouvelles notifications en temps réel
  const subscribeToNotifications = () => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotification = payload.new as LiveNotification;

          // Ajouter à la liste
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Afficher une notification push locale
          await showLocalNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  // Afficher une notification push locale
  const showLocalNotification = async (notification: LiveNotification) => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data,
          sound: true,
          badge: unreadCount + 1,
        },
        trigger: null, // Immédiat
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  };

  // Marquer des notifications comme lues
  const markAsRead = useCallback(
    async (notificationIds: string[]) => {
      if (!user) return;

      try {
        const { error } = await supabase.rpc('mark_notifications_read', {
          p_user_id: user.id,
          p_notification_ids: notificationIds,
        });

        if (error) throw error;

        // Mettre à jour l'état local
        setNotifications((prev) =>
          prev.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    },
    [user]
  );

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const unreadIds = notifications
      .filter((n) => !n.read)
      .map((n) => n.id);

    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [user, notifications, markAsRead]);

  // Supprimer une notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Mettre à jour l'état local
        const deletedNotif = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    [user, notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
  };
}

/**
 * Hook pour demander les permissions de notifications
 */
export function useNotificationPermissions() {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'web') {
      setHasPermission(true);
      setLoading(false);
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'web') return true;

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  return {
    hasPermission,
    loading,
    requestPermissions,
  };
}
