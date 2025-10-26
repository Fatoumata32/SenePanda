import { useState, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Product, ProductReview } from '@/types/database';
import { ArrowLeft, ShoppingCart, Minus, Plus, MessageSquare, Edit, MessageCircle, Store, Heart, ChevronLeft, ChevronRight, Check, Star, MapPin, ShoppingBag, UserPlus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RatingStars from '@/components/RatingStars';
import ReviewCard from '@/components/ReviewCard';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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

  // Mock images for carousel (in real app, these would come from product.images array)
  const productImages = product?.image_url ? [product.image_url, product.image_url, product.image_url, product.image_url] : [];

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
            { text: 'Se connecter', onPress: () => router.push('/profile') },
          ]
        );
        return;
      }

      if (user.id === product?.seller_id) {
        Alert.alert('Information', 'Vous ne pouvez pas vous contacter vous-même');
        return;
      }

      // Create or get conversation
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        p_buyer_id: user.id,
        p_seller_id: product?.seller_id,
        p_product_id: id as string,
      });

      if (error) throw error;

      router.push(`/chat/${conversationId}`);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      Alert.alert('Erreur', 'Impossible de contacter le vendeur');
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

  const toggleFollow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Connexion requise', 'Veuillez vous connecter');
        return;
      }

      // Toggle follow logic here (implement followers table if needed)
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const addToCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Connexion requise',
          'Veuillez vous connecter pour ajouter des articles au panier',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se connecter', onPress: () => router.push('/profile') },
          ]
        );
        return;
      }

      setAdding(true);

      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: id as string,
            quantity,
          });

        if (error) throw error;
      }

      Alert.alert('Succès', 'Produit ajouté au panier');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DÉTAILS</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
          <Heart size={24} color={isFavorite ? "#EC4899" : "#6B7280"} fill={isFavorite ? "#EC4899" : "none"} />
        </TouchableOpacity>
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
        <View style={styles.content}>
          <Text style={styles.productName}>{product.title}</Text>
          <Text style={styles.productPrice}>
            {product.price.toLocaleString('fr-FR')} <Text style={styles.currency}>F CFA</Text>
          </Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Star size={16} color="#FFA500" fill="#FFA500" />
            <Text style={styles.ratingText}>
              {product.average_rating?.toFixed(1) || '4.8'} ({product.total_reviews || 156} avis)
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            {product.description || 'Ce savon naturel éclaircissant est formulé avec des ingrédients de haute qualité pour donner à votre peau un éclat naturel. Parfait pour tous les types de peau.'}
          </Text>

          {/* Seller Info Card */}
          {sellerInfo && (
            <View style={styles.sellerCard}>
              <View style={styles.sellerHeader}>
                <ShoppingBag size={20} color="#FF8C42" />
                <Text style={styles.sellerShopName}>{sellerInfo.shop_name || 'Santé Yalla Boutique'}</Text>
              </View>

              <View style={styles.sellerInfoRow}>
                <Image
                  source={{ uri: sellerInfo.avatar_url || 'https://via.placeholder.com/60' }}
                  style={styles.sellerAvatar}
                />
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{sellerInfo.full_name || 'Eleka'}</Text>
                  <View style={styles.sellerLocationRow}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.sellerLocation}>{sellerInfo.city || 'Dakar'}, {sellerInfo.country || 'Sénégal'}</Text>
                  </View>
                  <View style={styles.sellerStatsRow}>
                    <Star size={14} color="#FFA500" fill="#FFA500" />
                    <Text style={styles.sellerRating}>4.3</Text>
                    <Text style={styles.sellerYears}>• 12 ans</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={toggleFollow}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.followButton}>
                    <Text style={styles.followButtonText}>{isFollowing ? 'Abonné' : 'Suivre'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.sellerActions}>
                <TouchableOpacity
                  style={styles.boutiqueButton}
                  onPress={() => router.push(`/shop/${product.seller_id}`)}>
                  <ShoppingBag size={18} color="#6B7280" />
                  <Text style={styles.boutiqueButtonText}>Boutique</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={contactSeller}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.discuterButton}>
                    <MessageCircle size={18} color="#FFFFFF" />
                    <Text style={styles.discuterButtonText}>Discuter</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sellerShopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sellerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FF8C42',
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
    marginBottom: 4,
  },
  sellerLocation: {
    fontSize: 13,
    color: '#6B7280',
  },
  sellerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerRating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  sellerYears: {
    fontSize: 13,
    color: '#6B7280',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sellerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  boutiqueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  boutiqueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
});
