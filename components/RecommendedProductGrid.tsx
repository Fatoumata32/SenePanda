import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ProductImage } from './ProductImage';
import RecommendationBadge from './RecommendationBadge';
import { memo, useCallback, useState, useEffect } from 'react';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Heart } from 'lucide-react-native';
import useProductRecommendations, { RecommendedProduct } from '@/hooks/useProductRecommendations';

const { width } = Dimensions.get('window');
const SPACING = 8;
const IMAGE_SIZE = (width - (SPACING * 3)) / 2;

type RecommendedProductGridProps = {
  products: RecommendedProduct[];
};

const ProductCard = memo(({ product, index }: { product: RecommendedProduct; index: number }) => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const { recordClick, recordFavorite } = useProductRecommendations();

  useEffect(() => {
    if (user && !authLoading) {
      checkFavorite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, product.id]);

  const checkFavorite = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async (e: any) => {
    e.stopPropagation();
    if (authLoading || !user) {
      if (!user) router.push('/(tabs)/profile');
      return;
    }

    try {
      if (isFavorite) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', product.id);
        setIsFavorite(false);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: product.id });
        setIsFavorite(true);
        recordFavorite(product.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handlePress = useCallback(() => {
    recordClick(product.id);
    router.push(`/product/${product.id}`);
  }, [product.id, router, recordClick]);

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'FCFA' || currency === 'XOF') {
      return `${price.toLocaleString()} F`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { marginRight: (index % 2 === 0) ? SPACING : 0 }]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <ProductImage
          imageUrl={product.image_url}
          images={product.images}
          style={styles.image}
        />

        {/* Badge de recommandation */}
        {product.recommendation_reason && (
          <View style={styles.badgePosition}>
            <RecommendationBadge type={product.recommendation_reason} />
          </View>
        )}

        {/* Favoris */}
        <TouchableOpacity style={styles.heartBtn} onPress={toggleFavorite}>
          <Heart
            size={18}
            color={isFavorite ? '#EF4444' : '#9CA3AF'}
            fill={isFavorite ? '#EF4444' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
      </View>
    </TouchableOpacity>
  );
});

ProductCard.displayName = 'ProductCard';

function RecommendedProductGrid({ products }: RecommendedProductGridProps) {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </View>
    </View>
  );
}

export default memo(RecommendedProductGrid);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    width: IMAGE_SIZE,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: SPACING,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_SIZE * 0.8,
    backgroundColor: '#F9FAFB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgePosition: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF8C00',
  },
});
