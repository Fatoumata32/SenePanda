import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';

type RatingStarsProps = {
  rating: number;
  size?: number;
  showNumber?: boolean;
  totalReviews?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
};

export default function RatingStars({
  rating,
  size = 16,
  showNumber = false,
  totalReviews,
  interactive = false,
  onRatingChange,
}: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const handleStarPress = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  const renderStar = (index: number, type: 'full' | 'half' | 'empty') => {
    const starEmoji = type === 'empty' ? '☆' : type === 'half' ? '⭐' : '⭐';

    const StarComponent = (
      <Text
        key={index}
        style={[
          styles.starEmoji,
          { fontSize: size },
          type === 'half' && styles.halfStar
        ]}>
        {starEmoji}
      </Text>
    );

    if (interactive) {
      return (
        <TouchableOpacity
          key={index}
          onPress={() => handleStarPress(index)}
          activeOpacity={0.7}>
          {StarComponent}
        </TouchableOpacity>
      );
    }

    return StarComponent;
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {/* Full stars */}
        {Array.from({ length: fullStars }, (_, i) => renderStar(i, 'full'))}

        {/* Half star */}
        {hasHalfStar && renderStar(fullStars, 'half')}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }, (_, i) => renderStar(fullStars + (hasHalfStar ? 1 : 0) + i, 'empty'))}
      </View>

      {showNumber && (
        <View style={styles.numberContainer}>
          <Text style={[styles.ratingNumber, { fontSize: size }]}>
            {rating.toFixed(1)}
          </Text>
          {totalReviews !== undefined && (
            <Text style={[styles.totalReviews, { fontSize: size * 0.75 }]}>
              ({totalReviews})
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  starEmoji: {
    lineHeight: undefined,
  },
  halfStar: {
    opacity: 0.5,
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNumber: {
    fontWeight: '700',
    color: '#111827',
  },
  totalReviews: {
    color: '#6B7280',
    fontWeight: '500',
  },
});
