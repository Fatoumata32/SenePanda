import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Product } from '@/types/database';
import { useRouter } from 'expo-router';
import { ProductImage } from './ProductImage';
import { memo, useCallback, useState, useEffect } from 'react';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const SPACING = 8;
const IMAGE_SIZE = (width - (SPACING * 3)) / 2;

type SimpleProductGridProps = {
  products: Product[];
};

const ProductImageItem = memo(({ product, index }: { product: Product; index: number }) => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      checkFavorite();
    }
  }, [user, authLoading, product.id]);

  const checkFavorite = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite:', error);
        return;
      }

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error in checkFavorite:', error);
    }
  };

  const toggleFavorite = async (e: any) => {
    e.stopPropagation();
    e.preventDefault();

    // Attendre que l'authentification soit chargée
    if (authLoading) {
      return;
    }

    if (!user) {
      // Rediriger vers la connexion si non connecté
      router.push('/(tabs)/profile');
      return;
    }

    try {
      if (isFavorite) {
        // Retirer des favoris
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) {
          console.error('Error removing favorite:', error);
          return;
        }

        setIsFavorite(false);
      } else {
        // Ajouter aux favoris
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: product.id,
          });

        if (error) {
          console.error('Error adding favorite:', error);
          return;
        }

        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handlePress = useCallback(() => {
    router.push(`/product/${product.id}`);
  }, [product.id, router]);

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'XOF') {
      return `${price.toLocaleString()} FCFA`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        { marginRight: (index % 2 === 0) ? SPACING : 0, marginBottom: SPACING }
      ]}
      onPress={handlePress}
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
          onPress={toggleFavorite}>
          <Heart
            size={20}
            color={isFavorite ? '#EF4444' : '#9CA3AF'}
            fill={isFavorite ? '#EF4444' : 'transparent'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>
          {formatPrice(product.price, product.currency)}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

ProductImageItem.displayName = 'ProductImageItem';

function SimpleProductGrid({ products }: SimpleProductGridProps) {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {products.map((product, index) => (
          <ProductImageItem
            key={product.id}
            product={product}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

export default memo(SimpleProductGrid);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardContainer: {
    width: IMAGE_SIZE,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_SIZE * 0.75,
    backgroundColor: '#F3F4F6',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  infoContainer: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark,
    marginBottom: 4,
    lineHeight: 18,
  },
  price: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: '#FF8C00',
  },
});
