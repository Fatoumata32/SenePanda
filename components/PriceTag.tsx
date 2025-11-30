import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';

type PriceTagProps = {
  price: number;
  currency?: string;
  originalPrice?: number;
  discount?: number;
  size?: 'small' | 'medium' | 'large';
  showCurrency?: boolean;
  bold?: boolean;
  style?: ViewStyle;
};

export default function PriceTag({
  price,
  currency = 'FCFA',
  originalPrice,
  discount,
  size = 'medium',
  showCurrency = true,
  bold = true,
  style,
}: PriceTagProps) {
  const formatPrice = (amount: number): string => {
    const formatted = amount.toLocaleString('fr-FR');
    if (!showCurrency) return formatted;

    if (currency === 'FCFA') {
      return `${formatted} FCFA`;
    }
    return `${formatted} ${currency}`;
  };

  const getPriceSize = (): TextStyle => {
    switch (size) {
      case 'small':
        return {
          fontSize: Typography.fontSize.sm,
          lineHeight: 18,
        };
      case 'large':
        return {
          fontSize: Typography.fontSize.xl,
          lineHeight: 28,
        };
      case 'medium':
      default:
        return {
          fontSize: Typography.fontSize.lg,
          lineHeight: 24,
        };
    }
  };

  const hasDiscount = originalPrice && originalPrice > price;
  const calculatedDiscount = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : discount;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.priceRow}>
        <Text
          style={[
            styles.price,
            getPriceSize(),
            { fontWeight: bold ? Typography.fontWeight.bold : Typography.fontWeight.semibold },
          ]}>
          {formatPrice(price)}
        </Text>

        {calculatedDiscount && calculatedDiscount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{calculatedDiscount}%</Text>
          </View>
        )}
      </View>

      {hasDiscount && (
        <Text style={[styles.originalPrice, { fontSize: size === 'small' ? 11 : size === 'large' ? Typography.fontSize.sm : 12 }]}>
          {formatPrice(originalPrice)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  price: {
    color: Colors.primaryOrange,
  },
  originalPrice: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginTop: Spacing.xs - 2,
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  discountText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
});
