import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { Product } from '@/types/database';
import { getLogoById } from '@/lib/shop-designs';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import RatingStars from './RatingStars';
import { ProductImage } from './ProductImage';
import { useFavorite } from '@/hooks/useFavorites';
import * as Speech from 'expo-speech';
import { Volume2, Heart } from 'lucide-react-native';

type ProductCardProps = {
  product: Product & {
    seller?: {
      id: string;
      shop_name: string;
      shop_logo_url: string;
    };
  };
  onPress: () => void;
};

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite: toggle } = useFavorite(product.id);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrée animée
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleToggleFavorite = async (e: any) => {
    e.stopPropagation();
    e.preventDefault();

    const result = await toggle();

    // Si result est null, l'utilisateur n'est pas connecté
    if (result === null) {
      router.push('/(tabs)/profile');
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'XOF') {
      return `${price.toLocaleString()} FCFA`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  const handleShopPress = (e: any) => {
    e.stopPropagation();
    if (product.seller_id) {
      router.push(`/shop/${product.seller_id}`);
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const speakPrice = (e: any) => {
    e.stopPropagation();
    e.preventDefault();

    const priceText = product.currency === 'XOF'
      ? `${product.price.toLocaleString()} francs CFA`
      : `${product.price.toLocaleString()} ${product.currency}`;

    const stockText = product.stock > 0 ? 'En stock' : 'Rupture de stock';

    Speech.speak(`${product.title}. Prix: ${priceText}. ${stockText}`, {
      language: 'fr-FR',
      pitch: 1.0,
      rate: 0.85,
    });
  };

  // Vérifier si c'est une URL ou un ID
  const isLogoUrl = product.seller?.shop_logo_url?.startsWith('http://') ||
                    product.seller?.shop_logo_url?.startsWith('https://');
  const logo = isLogoUrl ? null : (product.seller?.shop_logo_url ? getLogoById(product.seller.shop_logo_url) : null);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}>
        <View style={styles.imageContainer}>
        <ProductImage
          imageUrl={product.image_url}
          images={product.images}
          style={styles.image}
        />
        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}>
          <Heart
            size={24}
            color={isFavorite ? '#EF4444' : '#9CA3AF'}
            fill={isFavorite ? '#EF4444' : 'transparent'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(product.price, product.currency)}
          </Text>
          <TouchableOpacity
            style={styles.speakerButton}
            onPress={speakPrice}
            activeOpacity={0.7}
          >
            <Volume2 size={18} color="#F97316" />
          </TouchableOpacity>
        </View>

        {/* Rating */}
        {product.total_reviews > 0 && (
          <View style={styles.ratingContainer}>
            <RatingStars rating={product.average_rating} size={14} showNumber totalReviews={product.total_reviews} />
          </View>
        )}

        {/* Shop info */}
        {product.seller && (
          <TouchableOpacity style={styles.shopBadge} onPress={handleShopPress}>
            {isLogoUrl ? (
              <Image
                source={{ uri: product.seller.shop_logo_url }}
                style={[styles.shopLogo, { backgroundColor: '#F3F4F6' }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.shopLogo, { backgroundColor: logo?.bgColor || '#FEF3C7' }]}>
                <Text style={styles.shopLogoIcon}>{logo?.icon || '🛍️'}</Text>
              </View>
            )}
            <Text style={styles.shopName} numberOfLines={1}>
              {product.seller.shop_name}
            </Text>
          </TouchableOpacity>
        )}

        {product.stock > 0 ? (
          <Text style={styles.stock}>En stock</Text>
        ) : (
          <Text style={styles.outOfStock}>Rupture de stock</Text>
        )}
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1C',
    marginBottom: 4,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF8C00',
  },
  speakerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  shopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  shopLogo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopLogoIcon: {
    fontSize: 10,
  },
  shopName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
  },
  stock: {
    fontSize: 11,
    color: '#FF8C00',
    fontWeight: '600',
  },
  outOfStock: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
});
