import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { Bell, Package, Star, Gift, MessageCircle, ShoppingCart, TrendingUp, X, Check, ArrowLeft, Trash2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { isDark } = useTheme();
  const { refreshCount, decrementCount, hideNotification, hiddenIds } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<any>(null);
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');

  const themeColors = useMemo(() => ({
    background: isDark ? '#111827' : Colors.backgroundLight,
    card: isDark ? '#1F2937' : Colors.white,
    text: isDark ? '#F9FAFB' : Colors.textPrimary,
    textSecondary: isDark ? '#D1D5DB' : Colors.textSecondary,
    textMuted: isDark ? '#9CA3AF' : Colors.textMuted,
    border: isDark ? '#374151' : Colors.borderLight,
  }), [isDark]);

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
      const allNotifications: Notification[] = [];

      // 1. Charger les notifications depuis la table notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notificationsData) {
        notificationsData.forEach(notif => {
          allNotifications.push({
            id: notif.id,
            type: (notif.type as NotificationType) || 'promo',
            title: notif.title || 'Notification',
            message: notif.message || notif.body || '',
            read: notif.is_read ?? notif.read ?? false,
            created_at: notif.created_at,
            action_url: notif.action_url,
          });
        });
      }

      // 2. Charger les deal_notifications
      const { data: dealNotificationsData } = await supabase
        .from('deal_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (dealNotificationsData) {
        dealNotificationsData.forEach(deal => {
          allNotifications.push({
            id: `deal-${deal.id}`,
            type: 'promo',
            title: deal.title || 'Offre spéciale',
            message: deal.message || deal.description || '',
            read: deal.is_read ?? false,
            created_at: deal.created_at,
            action_url: deal.action_url || '/explore',
          });
        });
      }

      // 3. Charger les notifications de commandes récentes
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (ordersData) {
        ordersData.forEach(order => {
          const statusMessages: Record<string, string> = {
            pending: 'Votre commande est en attente de confirmation',
            confirmed: 'Votre commande a été confirmée',
            shipped: 'Votre commande est en cours de livraison',
            delivered: 'Votre commande a été livrée',
            cancelled: 'Votre commande a été annulée',
          };

          allNotifications.push({
            id: `order-${order.id}`,
            type: 'order',
            title: `Commande ${order.status === 'delivered' ? 'livrée' : order.status === 'shipped' ? 'expédiée' : 'mise à jour'}`,
            message: statusMessages[order.status] || 'Mise à jour de votre commande',
            read: true,
            created_at: order.updated_at || order.created_at,
            action_url: '/orders',
          });
        });
      }

      // 4. Charger les transactions de points récentes
      const { data: pointsTxData } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (pointsTxData) {
        pointsTxData.forEach(tx => {
          if (tx.points > 0) {
            allNotifications.push({
              id: `points-${tx.id}`,
              type: 'reward',
              title: `+${tx.points} PandaCoins`,
              message: tx.description || 'Points bonus',
              read: true,
              created_at: tx.created_at,
              action_url: '/wallet',
            });
          }
        });
      }

      // 5. Charger les messages non lus
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, text, content, created_at, read, is_read, sender_id')
        .eq('receiver_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messagesData) {
        messagesData.forEach(msg => {
          const messageText = msg.text || msg.content || '';
          allNotifications.push({
            id: `msg-${msg.id}`,
            type: 'message',
            title: 'Nouveau message',
            message: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '') || 'Vous avez un nouveau message',
            read: msg.read || msg.is_read || false,
            created_at: msg.created_at,
            action_url: '/chat',
          });
        });
      }

      // Dédupliquer par ID et filtrer les notifications masquées
      const uniqueNotifications = allNotifications.reduce((acc, curr) => {
        // Ignorer si déjà présent ou masqué
        if (!acc.find(n => n.id === curr.id) && !hiddenIds.includes(curr.id)) {
          acc.push(curr);
        }
        return acc;
      }, [] as Notification[]);

      // Trier par date décroissante
      uniqueNotifications.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(uniqueNotifications);

      // Marquer les notifications de la table comme lues automatiquement
      if (notificationsData && notificationsData.length > 0) {
        const unreadIds = notificationsData.filter(n => !n.is_read && !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }

      if (dealNotificationsData && dealNotificationsData.length > 0) {
        const unreadDealIds = dealNotificationsData.filter(n => !n.is_read).map(n => n.id);
        if (unreadDealIds.length > 0) {
          await supabase
            .from('deal_notifications')
            .update({ is_read: true })
            .in('id', unreadDealIds);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

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

  const deleteNotification = async (id: string) => {
    try {
      // Supprimer de l'état local immédiatement
      setNotifications(notifications.filter(n => n.id !== id));

      // Décrémenter le compteur global
      decrementCount(1);

      // Supprimer/masquer selon le type d'ID
      if (id.startsWith('deal-')) {
        const realId = id.replace('deal-', '');
        await supabase.from('deal_notifications').delete().eq('id', realId);
      } else if (id.startsWith('order-') || id.startsWith('points-') || id.startsWith('msg-')) {
        // Ces notifications sont générées dynamiquement
        // Les masquer via AsyncStorage pour qu'elles ne reviennent pas
        await hideNotification(id);
      } else {
        // Notification standard - supprimer de la DB
        await supabase.from('notifications').delete().eq('id', id);
      }

      console.log('🗑️ Notification supprimée/masquée:', id);
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await loadNotifications(user.id);
    }
    // Rafraîchir le compteur global
    await refreshCount();
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
      style={[
        styles.notificationCard,
        { backgroundColor: themeColors.card },
        !item.read && styles.unread
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: getIconBackground(item.type) }]}>
        {getIcon(item.type)}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.message, { color: themeColors.textSecondary }]} numberOfLines={2}>{item.message}</Text>
        <Text style={[styles.time, { color: themeColors.textMuted }]}>{formatTime(item.created_at)}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item.id)}>
        <X size={18} color={themeColors.textMuted} />
      </TouchableOpacity>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = useMemo(() => {
    if (filterType === 'all') return notifications;
    return notifications.filter(n => n.type === filterType);
  }, [notifications, filterType]);

  const filterOptions: Array<{ type: NotificationType | 'all'; label: string; icon: any }> = [
    { type: 'all', label: 'Toutes', icon: Bell },
    { type: 'order', label: 'Commandes', icon: Package },
    { type: 'reward', label: 'Récompenses', icon: Gift },
    { type: 'message', label: 'Messages', icon: MessageCircle },
    { type: 'promo', label: 'Promos', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header avec retour */}
      <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={themeColors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} non lue(s)</Text>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Check size={20} color={Colors.primaryOrange} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres améliorés */}
      <View style={[styles.filtersWrapper, { backgroundColor: themeColors.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}>
          {filterOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = filterType === option.type;
            const count = notifications.filter(n => option.type === 'all' ? true : n.type === option.type).length;

            return (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? Colors.primaryOrange : themeColors.card,
                    borderColor: isSelected ? Colors.primaryOrange : themeColors.border,
                  }
                ]}
                onPress={() => setFilterType(option.type)}
                activeOpacity={0.7}>
                <View style={[
                  styles.filterIconWrapper,
                  { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : themeColors.background }
                ]}>
                  <Icon size={18} color={isSelected ? Colors.white : Colors.primaryOrange} />
                  {count > 0 && (
                    <View style={[
                      styles.iconBadge,
                      { backgroundColor: isSelected ? Colors.white : Colors.primaryOrange }
                    ]}>
                      <Text style={[
                        styles.iconBadgeText,
                        { color: isSelected ? Colors.primaryOrange : Colors.white }
                      ]}>
                        {count > 99 ? '99+' : count}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.filterChipText,
                  { color: isSelected ? Colors.white : themeColors.text }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryOrange}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={80} color={themeColors.textMuted} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Aucune notification</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryOrange,
    marginTop: 2,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4E6',
  },
  filtersWrapper: {
    paddingVertical: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 120,
  },
  filterIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  iconBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  list: {
    padding: Spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
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
    marginBottom: 4,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: Typography.fontSize.xs,
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
});
