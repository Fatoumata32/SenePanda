import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { Bell, Package, Star, Gift, MessageCircle, ShoppingCart, TrendingUp, X, Check } from 'lucide-react-native';
import * as Speech from 'expo-speech';

type NotificationType = 'order' | 'review' | 'reward' | 'message' | 'cart' | 'promo';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadNotifications(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      // Pour l'instant, charger depuis la table deal_notifications ou créer des notifications de démo
      const { data, error } = await supabase
        .from('deal_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Mapper les notifications
      const mapped: Notification[] = data?.map(n => ({
        id: n.id,
        type: 'promo' as NotificationType,
        title: 'Promo Flash disponible !',
        message: `Une nouvelle promotion vous attend`,
        read: n.is_read || false,
        created_at: n.created_at,
      })) || [];

      // Ajouter des notifications de démo si vide
      if (mapped.length === 0) {
        setNotifications(getDemoNotifications());
      } else {
        setNotifications(mapped);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications(getDemoNotifications());
    }
  };

  const getDemoNotifications = (): Notification[] => [
    {
      id: '1',
      type: 'order',
      title: 'Commande expédiée',
      message: 'Votre commande #12345 est en route !',
      read: false,
      created_at: new Date().toISOString(),
      action_url: '/orders',
    },
    {
      id: '2',
      type: 'reward',
      title: 'Nouveaux PandaCoins !',
      message: 'Vous avez gagné 50 PandaCoins',
      read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      action_url: '/wallet',
    },
    {
      id: '3',
      type: 'message',
      title: 'Nouveau message',
      message: 'Un vendeur a répondu à votre question',
      read: true,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      action_url: '/chat',
    },
    {
      id: '4',
      type: 'promo',
      title: 'Promo Flash -30%',
      message: 'Ne manquez pas nos offres du jour !',
      read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const getIcon = (type: NotificationType) => {
    const iconProps = { size: 24, color: Colors.white };
    switch (type) {
      case 'order': return <Package {...iconProps} />;
      case 'review': return <Star {...iconProps} />;
      case 'reward': return <Gift {...iconProps} />;
      case 'message': return <MessageCircle {...iconProps} />;
      case 'cart': return <ShoppingCart {...iconProps} />;
      case 'promo': return <TrendingUp {...iconProps} />;
      default: return <Bell {...iconProps} />;
    }
  };

  const getIconBackground = (type: NotificationType): string => {
    switch (type) {
      case 'order': return Colors.primaryOrange;
      case 'reward': return Colors.primaryGold;
      case 'message': return '#3B82F6';
      case 'promo': return '#EF4444';
      default: return Colors.textSecondary;
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Marquer comme lue
    if (!notification.read) {
      const updated = notifications.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      );
      setNotifications(updated);
    }

    // Navigation
    if (notification.action_url) {
      router.push(notification.action_url as any);
    }
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    Speech.speak('Toutes les notifications marquées comme lues', { language: 'fr-FR' });
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await loadNotifications(user.id);
    }
    setRefreshing(false);
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unread]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: getIconBackground(item.type) }]}>
        {getIcon(item.type)}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item.id)}>
        <X size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} non lue(s)</Text>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Check size={18} color={Colors.primaryOrange} />
            <Text style={styles.markAllText}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={80} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              Vous serez notifié ici pour vos commandes, messages et promotions
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryOrange,
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryOrange,
    fontWeight: Typography.fontWeight.semibold,
  },
  list: {
    padding: Spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
    position: 'relative',
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryOrange,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  deleteButton: {
    padding: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryOrange,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
