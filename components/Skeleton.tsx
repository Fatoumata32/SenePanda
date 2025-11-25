import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width: w = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: w,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      <Skeleton height={150} borderRadius={12} />
      <View style={styles.productContent}>
        <Skeleton height={16} width="80%" style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="60%" style={{ marginBottom: 8 }} />
        <Skeleton height={18} width="40%" />
      </View>
    </View>
  );
}

// Product List Skeleton
export function ProductListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.productList}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </View>
  );
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <Skeleton width={80} height={80} borderRadius={40} />
        <View style={styles.profileInfo}>
          <Skeleton height={20} width="70%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="50%" />
        </View>
      </View>
      <View style={styles.profileStats}>
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.statItem}>
            <Skeleton height={24} width={40} style={{ marginBottom: 4 }} />
            <Skeleton height={12} width={60} />
          </View>
        ))}
      </View>
    </View>
  );
}

// Message List Skeleton
export function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.messageItem}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <View style={styles.messageContent}>
            <Skeleton height={16} width="60%" style={{ marginBottom: 6 }} />
            <Skeleton height={12} width="90%" />
          </View>
          <Skeleton height={10} width={40} />
        </View>
      ))}
    </View>
  );
}

// Order Card Skeleton
export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Skeleton height={14} width="40%" />
        <Skeleton height={20} width={80} borderRadius={10} />
      </View>
      <View style={styles.orderItems}>
        <Skeleton width={60} height={60} borderRadius={8} />
        <View style={styles.orderItemInfo}>
          <Skeleton height={14} width="70%" style={{ marginBottom: 6 }} />
          <Skeleton height={12} width="40%" />
        </View>
      </View>
      <View style={styles.orderFooter}>
        <Skeleton height={16} width="30%" />
        <Skeleton height={16} width="25%" />
      </View>
    </View>
  );
}

// Category List Skeleton
export function CategoryListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.categoryList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.categoryItem}>
          <Skeleton width={60} height={60} borderRadius={30} />
          <Skeleton height={12} width={50} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  productCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productContent: {
    padding: 12,
  },
  productList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  profileContainer: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItems: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  orderItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default Skeleton;
