import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ProductCardSkeletonProps {
  count?: number;
}

function ProductCardSkeletonItem() {
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
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.image, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.title, { opacity }]} />
        <Animated.View style={[styles.subtitle, { opacity }]} />
        <View style={styles.footer}>
          <Animated.View style={[styles.price, { opacity }]} />
          <Animated.View style={[styles.rating, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

function ProductCardSkeletonComponent({ count = 4 }: ProductCardSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeletonItem key={index} />
      ))}
    </View>
  );
}

export const ProductCardSkeleton = memo(ProductCardSkeletonComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: Colors.lightGray,
  },
  content: {
    padding: 12,
    gap: 8,
  },
  title: {
    height: 16,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    width: '80%',
  },
  subtitle: {
    height: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    width: '60%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    height: 18,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    width: '40%',
  },
  rating: {
    height: 14,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    width: '25%',
  },
});

export default ProductCardSkeleton;
