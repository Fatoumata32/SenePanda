import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Composant de base pour skeleton loader
 * Anime un effet de shimmer pour indiquer le chargement
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const colors = useThemeColors();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        style,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        } as any,
      ]}
    />
  );
};

/**
 * Skeleton pour une card produit
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <View style={styles.productCard}>
      <Skeleton width="100%" height={180} borderRadius={12} />
      <View style={styles.productCardContent}>
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
        <View style={styles.productCardFooter}>
          <Skeleton width={80} height={20} />
          <Skeleton width={40} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
};

/**
 * Grid de skeleton pour produits
 */
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton pour une catégorie
 */
export const CategorySkeleton: React.FC = () => {
  return (
    <View style={styles.category}>
      <Skeleton width={80} height={80} borderRadius={12} />
      <Skeleton width={60} height={12} style={{ marginTop: 8 }} />
    </View>
  );
};

/**
 * Skeleton pour liste de catégories
 */
export const CategoryListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.categoryList}>
      {Array.from({ length: count }).map((_, index) => (
        <CategorySkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton pour un élément de liste
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <View style={styles.listItem}>
      <Skeleton width={60} height={60} borderRadius={30} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={14} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  productCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productCardContent: {
    padding: 12,
  },
  productCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  category: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
  },
});
