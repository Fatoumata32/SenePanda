import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Typography, Spacing, BorderRadius } from '@/constants/Colors';

type FlashDeal = {
  deal_id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  seller_name: string;
  original_price: number;
  deal_price: number;
  discount_percentage: number;
  ends_at: string;
  time_remaining: string;
  total_stock: number;
  remaining_stock: number;
  is_featured: boolean;
  badge_text: string;
  badge_color: string;
};

export default function FlashDeals() {
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDeals();

    // Mettre à jour le compte à rebours toutes les secondes
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Subscribe aux changements
    const channel = supabase
      .channel('flash-deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flash_deals',
        },
        () => loadDeals()
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      channel.unsubscribe();
    };
  }, []);

  const loadDeals = async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_deals');

      if (error) {
        // Si la fonction n'existe pas encore, ignorer silencieusement
        console.warn('Flash deals function not available yet:', error);
        setDeals([]);
        return;
      }
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading flash deals:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt);
    const diff = end.getTime() - currentTime.getTime();

    if (diff <= 0) {
      return { expired: true, text: 'Terminé' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return {
        expired: false,
        text: `${hours}h ${minutes}m ${seconds}s`,
        urgent: hours < 1,
      };
    }

    return {
      expired: false,
      text: `${minutes}m ${seconds}s`,
      urgent: true,
    };
  };

  const renderDeal = ({ item }: { item: FlashDeal }) => {
    const timeInfo = getTimeRemaining(item.ends_at);
    const stockPercentage = (item.remaining_stock / item.total_stock) * 100;
    const isLowStock = stockPercentage < 30;

    return (
      <TouchableOpacity
        style={[
          styles.dealCard,
          item.is_featured && styles.featuredCard,
        ]}
        onPress={() => router.push(`/product/${item.product_id}`)}
        activeOpacity={0.8}
      >
        {/* Badge de réduction avec gradient */}
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}>
          <Text style={styles.badgeText}>
            -{item.discount_percentage}%
          </Text>
        </LinearGradient>

        {/* Image du produit */}
        <Image
          source={{ uri: item.product_image || 'https://via.placeholder.com/200' }}
          style={styles.productImage}
          resizeMode="cover"
        />

        {/* Contenu */}
        <View style={styles.dealContent}>
          {/* Titre */}
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.product_title}
          </Text>

          {/* Vendeur */}
          <Text style={styles.sellerName} numberOfLines={1}>
            Par {item.seller_name}
          </Text>

          {/* Prix */}
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>
                {item.original_price.toLocaleString()} FCFA
              </Text>
              <Text style={styles.dealPrice}>
                {item.deal_price.toLocaleString()} FCFA
              </Text>
            </View>
          </View>

          {/* Compte à rebours */}
          <View style={[styles.timerContainer, timeInfo.urgent && styles.timerUrgent]}>
            <Text style={styles.timerEmoji}>⏰</Text>
            <Text style={[styles.timerText, timeInfo.urgent && styles.timerTextUrgent]}>
              {timeInfo.expired ? 'Terminé' : `Se termine dans ${timeInfo.text}`}
            </Text>
          </View>

          {/* Barre de stock */}
          <View style={styles.stockSection}>
            <View style={styles.stockInfo}>
              <Text style={styles.stockText}>
                {item.remaining_stock > 0
                  ? `Plus que ${item.remaining_stock} en stock !`
                  : 'Épuisé'}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${stockPercentage}%`,
                    backgroundColor: isLowStock ? '#EF4444' : '#10B981',
                  },
                ]}
              />
            </View>
          </View>

          {/* Bouton CTA avec gradient */}
          <TouchableOpacity
            onPress={() => router.push(`/product/${item.product_id}`)}
            disabled={item.remaining_stock === 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={item.remaining_stock === 0 ? ['#9CA3AF', '#9CA3AF'] : ['#FFD700', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.claimButton}>
              <Text style={styles.claimButtonEmoji}>⚡</Text>
              <Text style={styles.claimButtonText}>
                {item.remaining_stock > 0 ? 'Profiter maintenant' : 'Épuisé'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (deals.length === 0) {
    return null; // Ne rien afficher si pas de deals actifs
  }

  return (
    <View style={styles.container}>
      {/* Header avec gradient */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#FFD700', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}>
            <Text style={styles.headerEmoji}>⚡</Text>
          </LinearGradient>
          <Text style={styles.headerTitle}>Promos Flash</Text>
        </View>
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </LinearGradient>
      </View>

      {/* Liste des deals */}
      <FlatList
        horizontal
        data={deals}
        keyExtractor={(item) => item.deal_id}
        renderItem={renderDeal}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={320}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing['2xl'],
  },
  loadingContainer: {
    padding: Spacing['4xl'],
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.gold,
  },
  headerEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  liveText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  dealCard: {
    width: 280,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: Colors.primaryGold,
  },
  badge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    zIndex: 10,
    ...Shadows.medium,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  dealContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  sellerName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  priceRow: {
    marginBottom: 12,
  },
  priceContainer: {
    gap: 4,
  },
  originalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  dealPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  timerUrgent: {
    backgroundColor: '#FEE2E2',
  },
  timerEmoji: {
    fontSize: 14,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  timerTextUrgent: {
    color: '#991B1B',
  },
  stockSection: {
    marginBottom: 10,
  },
  stockInfo: {
    marginBottom: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.orange,
  },
  claimButtonEmoji: {
    fontSize: 18,
  },
  claimButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
});
