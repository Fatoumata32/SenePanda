import { useState, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Product, SubscriptionPlanType } from '@/types/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Typography, Spacing, BorderRadius } from '@/constants/Colors';

const { width } = Dimensions.get('window');

interface FeaturedProduct extends Product {
  seller_name?: string;
  seller_badge?: string;
  plan_type?: SubscriptionPlanType;
}

const planBadges: Record<SubscriptionPlanType, { emoji: string; colors: string[]; label: string }> = {
  free: { emoji: '', colors: ['#6B7280', '#6B7280'], label: '' },
  starter: { emoji: '✓', colors: ['#3B82F6', '#2563EB'], label: 'Vérifié' },
  pro: { emoji: '📈', colors: ['#8B5CF6', '#7C3AED'], label: 'Pro' },
  premium: { emoji: '👑', colors: ['#FFD700', '#FF8C00'], label: 'Elite' },
};

function FeaturedProducts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<FeaturedProduct[]>([]);

  const loadFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Calculer le slot de rotation actuel (rotation toutes les 2 heures)
      const currentHour = new Date().getHours();
      const rotationSlot = Math.floor(currentHour / 2);

      // Requête complexe pour obtenir les produits mis en avant
      // avec un boost basé sur le plan d'abonnement
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          views_count,
          profiles!products_seller_id_fkey (
            shop_name,
            subscription_plan,
            seller_badge
          )
        `)
        .eq('is_active', true)
        .gte('stock', 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformer et trier les produits selon leur plan
      const transformedProducts: FeaturedProduct[] = (data || []).map((product: any) => ({
        ...product,
        seller_name: product.profiles?.shop_name || 'Vendeur',
        seller_badge: product.profiles?.seller_badge,
        plan_type: product.profiles?.subscription_plan || 'free',
      }));

      // Fonction de scoring pour le tri
      const getProductScore = (product: FeaturedProduct): number => {
        let score = 0;

        // Boost basé sur le plan (le plus important)
        switch (product.plan_type) {
          case 'premium':
            score += 1000; // Toujours en premier
            break;
          case 'pro':
            // Rotation toutes les 2 heures
            const productHash = product.id.split('-').reduce((acc, part) => acc + part.charCodeAt(0), 0);
            if (productHash % 12 === rotationSlot) {
              score += 500; // Boost pendant leur slot
            } else {
              score += 300; // Score de base Pro
            }
            break;
          case 'starter':
            // Apparition occasionnelle (1 jour sur 2)
            const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
            const starterHash = product.id.split('-').reduce((acc, part) => acc + part.charCodeAt(0), 0);
            if ((dayOfYear + starterHash) % 2 === 0) {
              score += 100;
            }
            break;
          case 'free':
            score += 0; // Pas de boost
            break;
        }

        // Boost basé sur les évaluations
        score += product.average_rating * 10;
        score += Math.min(product.total_reviews * 2, 50);

        // Boost basé sur la fraîcheur
        const productAge = Date.now() - new Date(product.created_at).getTime();
        const daysOld = productAge / (1000 * 60 * 60 * 24);
        if (daysOld < 7) {
          score += 30; // Nouveau produit
        }

        return score;
      };

      // Trier les produits selon leur score
      const sortedProducts = transformedProducts.sort((a, b) => {
        return getProductScore(b) - getProductScore(a);
      });

      // Limiter à 20 produits maximum
      setProducts(sortedProducts.slice(0, 20));
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeaturedProducts();
    // Pas de rafraîchissement automatique - seulement au chargement initial
  }, [loadFeaturedProducts]);

  const renderProduct = useCallback((product: FeaturedProduct) => {
    const badge = product.plan_type ? planBadges[product.plan_type] : null;

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => router.push(`/product/${product.id}`)}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.noImage]}>
              <Text style={styles.noImageText}>Pas d'image</Text>
            </View>
          )}

          {/* Badge du plan avec gradient */}
          {badge && badge.emoji && (
            <LinearGradient
              colors={badge.colors as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planBadge}>
              <Text style={styles.planBadgeEmoji}>{badge.emoji}</Text>
              <Text style={styles.planBadgeText}>{badge.label}</Text>
            </LinearGradient>
          )}

          {/* Note avec gradient */}
          {product.average_rating > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingEmoji}>⭐</Text>
              <Text style={styles.ratingText}>
                {product.average_rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={styles.sellerName} numberOfLines={1}>
            {product.seller_name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              {product.price.toLocaleString()} {product.currency}
            </Text>
            {product.total_reviews > 0 && (
              <Text style={styles.reviewCount}>
                ({product.total_reviews})
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  if (loading || products.length === 0) {
    return null;
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
            <Text style={styles.headerEmoji}>👁️</Text>
          </LinearGradient>
          <Text style={styles.headerTitle}>Produits Mis en Avant</Text>
        </View>
        <TouchableOpacity onPress={loadFeaturedProducts}>
          <LinearGradient
            colors={['#32CD32', '#228B22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.refreshButton}>
            <Text style={styles.refreshText}>Actualiser</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <Text style={styles.headerSubtitle}>
        Sélection dynamique basée sur la qualité et l'abonnement des vendeurs
      </Text>

      {/* Products */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}>
        {products.map((product) => renderProduct(product))}
      </ScrollView>
    </View>
  );
}

export default memo(FeaturedProducts);

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
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
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
  refreshButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  refreshText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  productsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  productCard: {
    width: width * 0.42,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: width * 0.42,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  planBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  planBadgeEmoji: {
    fontSize: 12,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingEmoji: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    height: 34,
  },
  sellerName: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: Typography.fontWeight.bold,
    color: '#FF8C00',
  },
  reviewCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
