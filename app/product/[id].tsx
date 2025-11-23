import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Product, ProductReview } from '@/types/database';
import { ArrowLeft, ShoppingCart, Minus, Plus, MessageSquare, Edit, MessageCircle, Store, Heart, ChevronLeft, ChevronRight, Check, Star, MapPin, ShoppingBag, UserPlus, Phone, Share2, Shield, Truck, RotateCcw, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RatingStars from '@/components/RatingStars';
import ReviewCard from '@/components/ReviewCard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart: addToCartContext, loading: cartLoading } = useCart();
  const { isDark } = useTheme();

  // Theme colors
  const themeColors = {
    background: isDark ? '#111827' : '#FFFFFF',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#1F2937',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    textMuted: isDark ? '#9CA3AF' : '#9CA3AF',
    border: isDark ? '#374151' : '#E5E7EB',
    surface: isDark ? '#374151' : '#F9FAFB',
  };
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get product images - use images array if available, otherwise use image_url
  const productImages = product?.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product?.image_url
    ? [product.image_url]
    : [];

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
      checkCanReview();
      checkFavorite();
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchSellerInfo();
      fetchSimilarProducts();
      checkFollowing();
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      // Fetch reviews first
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];

      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to reviews
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const reviewsWithUsers = reviewsData.map(review => ({
        ...review,
        user: profilesMap.get(review.user_id) || null,
      }));

      setReviews(reviewsWithUsers);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkCanReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has purchased and received this product
      const { data } = await supabase
        .from('order_items')
        .select('*, order:orders!inner(*)')
        .eq('product_id', id)
        .eq('order.user_id', user.id)
        .eq('order.status', 'delivered');

      setCanReview(!!(data && data.length > 0));
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const contactSeller = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Connexion requise',
          'Veuillez vous connecter pour contacter le vendeur',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se connecter', onPress: () => router.push('/simple-auth') },
          ]
        );
        return;
      }

      if (user.id === product?.seller_id) {
        Alert.alert('Information', 'Vous ne pouvez pas vous contacter vous-même');
        return;
      }

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', product?.seller_id)
        .eq('product_id', id)
        .maybeSingle();

      let conversationId: string;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            buyer_id: user.id,
            seller_id: product?.seller_id,
            product_id: id as string,
            last_message: 'Nouvelle conversation',
            last_message_time: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;
      }

      router.push(`/chat/${conversationId}`);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      Alert.alert('Erreur', 'Impossible de contacter le vendeur. Veuillez réessayer.');
    }
  };

  const checkFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Connexion requise', 'Veuillez vous connecter');
        return;
      }

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Heart animation
      Animated.sequence([
        Animated.timing(heartAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        setIsFavorite(false);
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: id as string });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const callSeller = () => {
    if (sellerInfo?.phone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`tel:${sellerInfo.phone}`);
    }
  };

  const shareProduct = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Implement share functionality
    Alert.alert('Partager', 'Fonctionnalité de partage bientôt disponible');
  };

  const fetchSellerInfo = async () => {
    if (!product?.seller_id) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', product.seller_id)
        .maybeSingle();

      setSellerInfo(data);
    } catch (error) {
      console.error('Error fetching seller:', error);
    }
  };

  const fetchSimilarProducts = async () => {
    if (!product) return;

    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(5);

      setSimilarProducts(data || []);
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

  const checkFollowing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !product?.seller_id) return;

      const { data } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', product.seller_id)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking following status:', error);
    }
  };

  const toggleFollow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Connexion requise', 'Veuillez vous connecter pour suivre ce vendeur');
        return;
      }

      if (!product?.seller_id) return;

      if (isFollowing) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', product.seller_id);
        setIsFollowing(false);
      } else {
        // Follow
        await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: product.seller_id,
          });
        setIsFollowing(true);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      // Si la table n'existe pas, on continue sans erreur
      if (error?.code === 'PGRST204' || error?.message?.includes('does not exist')) {
        console.warn('La table followers n\'existe pas encore. Créez-la avec la migration.');
      } else {
        Alert.alert('Erreur', 'Impossible de suivre ce vendeur');
      }
    }
  };

  const addToCart = async () => {
    if (!id) return;

    setAdding(true);
    try {
      // Utiliser le contexte du panier pour synchroniser
      await addToCartContext(id as string, quantity);
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Produit introuvable</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.errorText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>DÉTAILS</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={shareProduct} style={styles.headerIconButton}>
            <Share2 size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
              <Heart size={24} color={isFavorite ? "#EC4899" : "#6B7280"} fill={isFavorite ? "#EC4899" : "none"} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel Section */}
        <View style={styles.imageSection}>
          <View style={styles.carouselContainer}>
            {/* Thumbnails on the left */}
            <View style={styles.thumbnailsContainer}>
              {productImages.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && styles.thumbnailActive,
                  ]}
                  onPress={() => setSelectedImageIndex(index)}>
                  <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Main Image */}
            <View style={styles.mainImageContainer}>
              <Image
                source={{ uri: productImages[selectedImageIndex] || 'https://via.placeholder.com/400' }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              {/* Blue checkmark badge */}
              <View style={styles.verifiedBadge}>
                <Check size={20} color="#FFFFFF" strokeWidth={3} />
              </View>

              {/* Navigation arrows */}
              <TouchableOpacity
                style={[styles.arrowButton, styles.arrowLeft]}
                onPress={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                disabled={selectedImageIndex === 0}>
                <ChevronLeft size={20} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.arrowButton, styles.arrowRight]}
                onPress={() => setSelectedImageIndex(Math.min(productImages.length - 1, selectedImageIndex + 1))}
                disabled={selectedImageIndex === productImages.length - 1}>
                <ChevronRight size={20} color="#1F2937" />
              </TouchableOpacity>

              {/* Dots indicator */}
              <View style={styles.dotsContainer}>
                {productImages.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, selectedImageIndex === index && styles.dotActive]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Product Info */}
        <View style={[styles.content, { backgroundColor: themeColors.background }]}>
          <Text style={[styles.productName, { color: themeColors.text }]}>{product.title}</Text>
          <Text style={styles.productPrice}>
            {product.price.toLocaleString('fr-FR')} <Text style={styles.currency}>F CFA</Text>
          </Text>

          {/* Rating */}
          {(product.average_rating > 0 || product.total_reviews > 0) && (
            <View style={styles.ratingRow}>
              <Star size={16} color="#FFA500" fill="#FFA500" />
              <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>
                {product.average_rating > 0 ? product.average_rating.toFixed(1) : 'Nouveau'}
                {product.total_reviews > 0 && ` (${product.total_reviews} avis)`}
              </Text>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <Text style={[styles.description, { color: themeColors.textSecondary }]}>
              {product.description}
            </Text>
          )}

          {/* Seller Info Card - Enhanced */}
          {sellerInfo && (
            <View style={styles.sellerCard}>
              {/* Shop Header with Gradient */}
              <LinearGradient
                colors={['#FFF7ED', '#FFEDD5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sellerHeaderGradient}>
                <View style={styles.sellerHeader}>
                  <View style={styles.shopIconContainer}>
                    <ShoppingBag size={18} color="#FF8C42" />
                  </View>
                  <View style={styles.shopNameContainer}>
                    <Text style={styles.sellerShopName}>{sellerInfo.shop_name || 'Ma Boutique'}</Text>
                    {sellerInfo.is_verified && (
                      <View style={styles.verifiedBadgeSmall}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>

              <View style={styles.sellerInfoRow}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: sellerInfo.avatar_url || 'https://via.placeholder.com/60' }}
                    style={styles.sellerAvatar}
                  />
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{sellerInfo.full_name || sellerInfo.username || 'Vendeur'}</Text>
                  <View style={styles.sellerLocationRow}>
                    <MapPin size={14} color="#FF8C42" />
                    <Text style={styles.sellerLocation}>
                      {sellerInfo.city || 'Dakar'}{sellerInfo.country ? `, ${sellerInfo.country}` : ', Sénégal'}
                    </Text>
                  </View>
                  <View style={styles.sellerStatsRow}>
                    <View style={styles.statBadge}>
                      <Star size={12} color="#FFA500" fill="#FFA500" />
                      <Text style={styles.sellerRating}>
                        {sellerInfo.average_rating > 0 ? sellerInfo.average_rating.toFixed(1) : '5.0'}
                      </Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Text style={styles.sellerYears}>
                        {Math.max(1, new Date().getFullYear() - new Date(sellerInfo.created_at || Date.now()).getFullYear())} an{Math.max(1, new Date().getFullYear() - new Date(sellerInfo.created_at || Date.now()).getFullYear()) > 1 ? 's' : ''}
                      </Text>
                    </View>
                    {sellerInfo.total_sales > 0 && (
                      <View style={styles.statBadge}>
                        <Text style={styles.salesCount}>{sellerInfo.total_sales}+ ventes</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={toggleFollow} style={styles.followButtonContainer}>
                  <LinearGradient
                    colors={isFollowing ? ['#10B981', '#059669'] : ['#FFD700', '#FFA500', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.followButton}>
                    {isFollowing ? (
                      <Check size={14} color="#FFFFFF" />
                    ) : (
                      <UserPlus size={14} color="#FFFFFF" />
                    )}
                    <Text style={styles.followButtonText}>{isFollowing ? 'Abonné' : 'Suivre'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Phone Number - if available */}
              {sellerInfo.phone && (
                <TouchableOpacity style={styles.phoneRow} onPress={callSeller} activeOpacity={0.7}>
                  <View style={styles.phoneIconContainer}>
                    <Phone size={16} color="#FF8C42" />
                  </View>
                  <Text style={styles.phoneNumber}>{sellerInfo.phone}</Text>
                  <View style={styles.callBadge}>
                    <Text style={styles.callBadgeText}>Appeler</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Action Buttons */}
              <View style={styles.sellerActions}>
                <TouchableOpacity
                  style={styles.boutiqueButton}
                  onPress={() => router.push(`/shop/${product.seller_id}`)}>
                  <ShoppingBag size={18} color="#FF8C42" />
                  <Text style={styles.boutiqueButtonText}>Voir la boutique</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={contactSeller}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.discuterButton}>
                    <MessageCircle size={18} color="#FFFFFF" />
                    <Text style={styles.discuterButtonText}>Contacter</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Trust Badges */}
          <View style={styles.trustSection}>
            <View style={styles.trustBadge}>
              <View style={styles.trustIconContainer}>
                <Truck size={18} color="#10B981" />
              </View>
              <View style={styles.trustTextContainer}>
                <Text style={styles.trustTitle}>Livraison rapide</Text>
                <Text style={styles.trustSubtitle}>Partout au Sénégal</Text>
              </View>
            </View>
            <View style={styles.trustBadge}>
              <View style={styles.trustIconContainer}>
                <RotateCcw size={18} color="#3B82F6" />
              </View>
              <View style={styles.trustTextContainer}>
                <Text style={styles.trustTitle}>Retours faciles</Text>
                <Text style={styles.trustSubtitle}>Sous 7 jours</Text>
              </View>
            </View>
            <View style={styles.trustBadge}>
              <View style={styles.trustIconContainer}>
                <Shield size={18} color="#8B5CF6" />
              </View>
              <View style={styles.trustTextContainer}>
                <Text style={styles.trustTitle}>Paiement sécurisé</Text>
                <Text style={styles.trustSubtitle}>100% protégé</Text>
              </View>
            </View>
          </View>

          {/* Similar Products */}
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>Produits Similaires</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
              {similarProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.similarCard}
                  onPress={() => router.push(`/product/${item.id}`)}>
                  <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    style={styles.similarImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.similarName} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.similarPrice}>
                    {item.price.toLocaleString('fr-FR')} <Text style={styles.similarCurrency}>F CFA</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar avec Quantité et Panier */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantité</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}>
              <Minus size={18} color={quantity <= 1 ? '#D1D5DB' : '#1F2937'} />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.min(product?.stock || 99, quantity + 1))}
              disabled={quantity >= (product?.stock || 99)}>
              <Plus size={18} color={quantity >= (product?.stock || 99) ? '#D1D5DB' : '#1F2937'} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addToCartButton, adding && styles.addToCartButtonDisabled]}
          onPress={addToCart}
          disabled={adding}>
          <LinearGradient
            colors={adding ? ['#D1D5DB', '#9CA3AF'] : ['#FFD700', '#FFA500', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addToCartGradient}>
            {adding ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <ShoppingCart size={20} color="#FFFFFF" />
                <Text style={styles.addToCartText}>Ajouter au panier</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSection: {
    backgroundColor: '#FFF8F0',
    paddingVertical: 16,
  },
  carouselContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  thumbnailsContainer: {
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#FF8C42',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  mainImageContainer: {
    flex: 1,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  content: {
    padding: 16,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  sellerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  sellerHeaderGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shopIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  shopNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerShopName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  verifiedBadgeSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FF8C42',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sellerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sellerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  sellerLocation: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  sellerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sellerRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  sellerYears: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  salesCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  followButtonContainer: {
    marginLeft: 8,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  phoneIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: 0.5,
    flex: 1,
  },
  callBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  callBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  sellerActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  boutiqueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  boutiqueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8C42',
  },
  discuterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  discuterButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trustBadge: {
    flex: 1,
    alignItems: 'center',
  },
  trustIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trustTextContainer: {
    alignItems: 'center',
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  trustSubtitle: {
    fontSize: 9,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  similarSection: {
    marginBottom: 24,
  },
  similarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  similarScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  similarCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  similarImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  similarName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  similarPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  similarCurrency: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  addToCartButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addToCartButtonDisabled: {
    opacity: 0.7,
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
