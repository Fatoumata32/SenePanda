import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Category } from '@/types/database';
import { memo } from 'react';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';

const CARD_WIDTH = 140;
const CARD_HEIGHT = 100;

type CategoryGridProps = {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  productCounts: { [key: string]: number };
  totalProducts: number;
};

const getCategoryImage = (icon: string) => {
  const images = {
    'palette': '🎨',
    'shirt': '👕',
    'gem': '💎',
    'home': '🏠',
    'image': '🖼️',
    'book': '📚',
    'music': '🎵',
    'camera': '📷',
    'watch': '⌚',
    'bag': '👜',
  };
  return images[icon as keyof typeof images] || '📦';
};

const CategoryGridItem = memo(({
  category,
  isSelected,
  onPress,
  count
}: {
  category: Category | null;
  isSelected: boolean;
  onPress: () => void;
  count: number;
}) => {
  const emoji = category ? getCategoryImage(category.icon || '') : '✦';
  const name = category ? category.name : 'Toutes les catégories';

  return (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={onPress}
      activeOpacity={0.9}>
      <LinearGradient
        colors={isSelected
          ? ['#FFD700', '#FFA500', '#FF8C00']
          : ['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.5)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.categoryGradient}>

        {/* Background emoji/icon */}
        <View style={styles.backgroundIconContainer}>
          <Text style={styles.backgroundIcon}>{emoji}</Text>
        </View>

        {/* Content */}
        <View style={styles.categoryContent}>
          <Text style={styles.categoryEmoji}>{emoji}</Text>
          <Text style={styles.categoryName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.categoryCount}>
            {count}
          </Text>
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectionBadge}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

CategoryGridItem.displayName = 'CategoryGridItem';

export default function CategoryGrid({
  categories,
  selectedCategory,
  onSelectCategory,
  productCounts,
  totalProducts
}: CategoryGridProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Parcourir par catégorie</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Toutes les catégories */}
        <CategoryGridItem
          category={null}
          isSelected={!selectedCategory}
          onPress={() => onSelectCategory(null)}
          count={totalProducts}
        />

        {/* Categories */}
        {categories.map((category) => (
          <CategoryGridItem
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.id}
            onPress={() => onSelectCategory(category.id)}
            count={productCounts[category.id] || 0}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  categoryGradient: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.medium,
  },
  backgroundIconContainer: {
    position: 'absolute',
    right: -15,
    bottom: -15,
    opacity: 0.12,
  },
  backgroundIcon: {
    fontSize: 80,
  },
  categoryContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  selectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
});
