import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Heart, ShoppingCart } from 'lucide-react-native';
import OptimizedImage from './OptimizedImage';
import { Colors } from '@/constants/Colors';
import { formatPrice } from '@/lib/formatters';
import { Product } from '@/types/database';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface OptimizedProductCardProps {
  product: Product;
  onFavoritePress?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  isFavorite?: boolean;
  showRating?: boolean;
  showAddToCart?: boolean;
}

function OptimizedProductCardComponent({
  product,
  onFavoritePress,
  onAddToCart,
  isFavorite = false,
  showRating = true,
  showAddToCart = false,
}: OptimizedProductCardProps) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/product/${product.id}`);
  }, [product.id, router]);

  const handleFavoritePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFavoritePress?.(product.id);
  }, [product.id, onFavoritePress]);

  const handleAddToCart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAddToCart?.(product.id);
  }, [product.id, onAddToCart]);

  const imageUrl = product.image_url || product.images?.[0] || '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={`Produit: ${product.title}, Prix: ${formatPrice(product.price)}`}
      accessibilityRole="button"
      accessibilityHint="Appuyez pour voir les détails du produit"
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <OptimizedImage
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={product.title}
        />

        {/* Favorite Button */}
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            accessibilityRole="button"
          >
            <Heart
              size={18}
              color={isFavorite ? Colors.error : Colors.white}
              fill={isFavorite ? Colors.error : 'transparent'}
            />
          </TouchableOpacity>
        )}

        {/* Stock Badge */}
        {product.stock === 0 && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Rupture</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {showRating && product.average_rating > 0 && (
          <View style={styles.ratingContainer}>
            <Star size={12} color={Colors.primaryGold} fill={Colors.primaryGold} />
            <Text style={styles.rating}>
              {product.average_rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({product.total_reviews})
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.price}>
            {formatPrice(product.price)}
          </Text>

          {showAddToCart && onAddToCart && product.stock > 0 && (
            <TouchableOpacity
              style={styles.cartButton}
              onPress={handleAddToCart}
              accessible={true}
              accessibilityLabel="Ajouter au panier"
              accessibilityRole="button"
            >
              <ShoppingCart size={16} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  cartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const OptimizedProductCard = memo(OptimizedProductCardComponent);
export default OptimizedProductCard;
