import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TrendingUp, TrendingDown, Eye, ShoppingCart, Star, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { formatPrice, formatNumber } from '@/lib/formatters';

interface ProductStats {
  id: string;
  name: string;
  image?: string;
  views: number;
  sales: number;
  revenue: number;
  rating?: number;
  change?: number; // percentage change in sales
}

interface ProductPerformanceProps {
  products: ProductStats[];
  onViewAll?: () => void;
  onProductPress?: (productId: string) => void;
  currency?: string;
  maxItems?: number;
  sortBy?: 'sales' | 'views' | 'revenue';
}

function ProductPerformanceComponent({
  products,
  onViewAll,
  onProductPress,
  currency = 'FCFA',
  maxItems = 5,
  sortBy = 'sales',
}: ProductPerformanceProps) {
  // Sort products based on sortBy
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return b.views - a.views;
      case 'revenue':
        return b.revenue - a.revenue;
      case 'sales':
      default:
        return b.sales - a.sales;
    }
  }).slice(0, maxItems);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance produits</Text>
        {onViewAll && products.length > 0 && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Tout voir</Text>
            <ChevronRight size={16} color={Colors.primaryOrange} />
          </TouchableOpacity>
        )}
      </View>

      {sortedProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingCart size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Aucun produit à afficher</Text>
        </View>
      ) : (
        <View style={styles.productList}>
          {sortedProducts.map((product, index) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productItem}
              onPress={() => onProductPress?.(product.id)}
              activeOpacity={0.7}
            >
              <View style={styles.productLeft}>
                <Text style={styles.rank}>#{index + 1}</Text>
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <ShoppingCart size={16} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={styles.productMeta}>
                    <View style={styles.metaItem}>
                      <Eye size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{formatNumber(product.views)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <ShoppingCart size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{product.sales}</Text>
                    </View>
                    {product.rating && (
                      <View style={styles.metaItem}>
                        <Star size={12} color={Colors.primaryGold} fill={Colors.primaryGold} />
                        <Text style={styles.metaText}>{product.rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.productRight}>
                <Text style={styles.revenue}>
                  {formatPrice(product.revenue, { currency, compact: true })}
                </Text>
                {product.change !== undefined && product.change !== 0 && (
                  <View style={styles.changeContainer}>
                    {product.change >= 0 ? (
                      <TrendingUp size={10} color={Colors.success} />
                    ) : (
                      <TrendingDown size={10} color={Colors.error} />
                    )}
                    <Text
                      style={[
                        styles.changeText,
                        product.change >= 0 ? styles.positiveChange : styles.negativeChange,
                      ]}
                    >
                      {product.change >= 0 ? '+' : ''}{product.change.toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryOrange,
  },
  productList: {
    gap: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rank: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 24,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  productRight: {
    alignItems: 'flex-end',
  },
  revenue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  positiveChange: {
    color: Colors.success,
  },
  negativeChange: {
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});

export const ProductPerformance = memo(ProductPerformanceComponent);
export default ProductPerformance;
