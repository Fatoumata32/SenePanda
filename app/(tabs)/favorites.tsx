import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
  AppState,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';
import ProductCard from '@/components/ProductCard';
import { Colors, Shadows, Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, ShoppingBag, Sparkles, Eye, MessageCircle, Trash2, Star, ChevronLeft, User } from 'lucide-react-native';
import { favoritesEvents } from '@/hooks/useFavorites';
import { useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  // Theme colors
  const themeColors = {
    background: isDark ? '#111827' : '#FFF8F0',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#1F2937',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    textMuted: isDark ? '#9CA3AF' : '#9CA3AF',
    border: isDark ? '#374151' : '#E5E7EB',
    headerBg: isDark ? '#1F2937' : '#FFFFFF',
    viewButtonBg: isDark ? '#374151' : '#F3F4F6',
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  // Recharger les favoris quand l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadFavorites();
      }
    }, [user?.id])
  );

  // Recharger quand l'app revient en avant-plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user) {
        loadFavorites();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // S'abonner aux changements de favoris via événements
  useEffect(() => {
    const unsubscribe = favoritesEvents.subscribe((productId, isFavorite) => {
      if (!isFavorite) {
        // Si un favori est retiré, retirer le produit de la liste
        setFavorites(prev => prev.filter(product => product.id !== productId));
      } else {
        // Si un favori est ajouté, recharger la liste complète
        if (user) {
          loadFavorites();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // S'abonner aux changements en temps réel dans Supabase
  useEffect(() => {
    if (!user) return;

    // Créer l'abonnement Supabase en temps réel
    const subscription = supabase
      .channel('favorites_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Favorite change detected:', payload);

          if (payload.eventType === 'INSERT') {
            // Nouveau favori ajouté
            loadFavorites();
          } else if (payload.eventType === 'DELETE') {
            // Favori supprimé
            const deletedFavorite = payload.old as any;
            setFavorites(prev =>
              prev.filter(product => product.id !== deletedFavorite.product_id)
            );
          }
        }
      )
      .subscribe();

    // Nettoyer l'abonnement
    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const checkUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
  };

  const loadFavorites = async (isRefreshing = false) => {
    if (!user) return;

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Récupérer les favoris avec les infos des produits et vendeurs
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          created_at,
          products (
            *,
            seller:profiles!seller_id(
              id,
              shop_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading favorites:', error);
        throw error;
      }

      // Transformer les données
      const favoriteProducts = data
        ?.map((fav: any) => fav.products)
        .filter((product: any) => product !== null) || [];

      setFavorites(favoriteProducts);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    loadFavorites(true);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primaryGold} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Chargement...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
          <LinearGradient
            colors={['#FF6B6B', '#FF4757']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}>
            <Heart size={28} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
          <Text style={styles.headerTitle}>Mes Favoris</Text>
        </View>

        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconCircle}>
            <User size={40} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Connexion requise</Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            Connectez-vous pour voir vos produits favoris
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(tabs)/profile')}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginButtonGradient}>
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleRemoveFavorite = async (productId: string) => {
    Alert.alert(
      'Retirer des favoris',
      'Voulez-vous retirer ce produit de vos favoris?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

              if (error) throw error;

              // Update local state
              setFavorites(prev => prev.filter(p => p.id !== productId));
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Erreur', 'Impossible de retirer le favori');
            }
          },
        },
      ]
    );
  };

  const handleStartChat = async (sellerId: string, productId: string) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour discuter avec le vendeur');
      return;
    }

    try {
      // Créer ou récupérer la conversation avec le vendeur
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        p_buyer_id: user.id,
        p_seller_id: sellerId,
        p_product_id: productId,
      });

      if (error) throw error;

      // Rediriger vers la conversation
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Erreur', 'Impossible de contacter le vendeur');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MES FAVORIS</Text>
        <TouchableOpacity style={styles.heartButton}>
          <Heart size={24} color={themeColors.text} fill={themeColors.card} strokeWidth={2} />
          {favorites.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{favorites.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={favorites}
        renderItem={({ item, index }) => {
          const isNew = item.created_at && new Date(item.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
          const discountPercentage = (item as any).discount_percentage;
          const hasDiscount = discountPercentage && discountPercentage > 0;

          return (
            <View style={[styles.productCard, { backgroundColor: themeColors.card }, index === 1 && styles.productCardSelected]}>
              {/* Product Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                {isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                {hasDiscount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
                  </View>
                )}
              </View>

              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: themeColors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.productPrice}>
                  {item.price.toLocaleString('fr-FR')} <Text style={styles.currency}>F CFA</Text>
                </Text>

                {/* Rating */}
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#FFA500" fill="#FFA500" />
                  <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>
                    {item.average_rating?.toFixed(1) || '0.0'} ({item.total_reviews || 0} avis)
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.viewButton, { backgroundColor: themeColors.viewButtonBg }]}
                    onPress={() => router.push(`/product/${item.id}`)}>
                    <Eye size={18} color={themeColors.textSecondary} />
                    <Text style={[styles.viewButtonText, { color: themeColors.textSecondary }]}>Voir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.chatButtonWrapper}
                    onPress={() => handleStartChat(item.seller_id, item.id)}>
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.chatButton}>
                      <MessageCircle size={18} color="#FFFFFF" />
                      <Text style={styles.chatButtonText}>Discuter</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveFavorite(item.id)}>
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8C42']}
            tintColor="#FF8C42"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={64} color={themeColors.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Aucun favori</Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Commencez à ajouter des produits à vos favoris
            </Text>
            <TouchableOpacity
              style={styles.exploreButtonWrapper}
              onPress={() => router.push('/(tabs)/explore')}>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.exploreButton}>
                <Text style={styles.exploreButtonText}>Explorer les produits</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF8C42',
    letterSpacing: 0.5,
  },
  heartButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productCardSelected: {
    borderColor: '#FF8C42',
    borderWidth: 3,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EC4899',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EC4899',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  currency: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  chatButtonWrapper: {
    flex: 1.2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  exploreButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
