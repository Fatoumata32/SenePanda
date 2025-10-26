import { View, ScrollView, Image, StyleSheet } from 'react-native';
import { useEffect, useRef, useState, memo } from 'react';
import { Shadows } from '@/constants/Colors';

const images = [
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
];

function PCCarousel() {
  const carouselRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % images.length;
        carouselRef.current?.scrollTo({ x: nextIndex * 94, y: 0, animated: true });
        return nextIndex;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.pcScreen}>
      <View style={styles.pcScreenInner}>
        <ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
          contentContainerStyle={styles.carouselContent}
          scrollEnabled={false}>
          {images.map((uri, index) => (
            <Image
              key={index}
              source={{ uri }}
              style={styles.carouselImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.pcBase} />
    </View>
  );
}

const styles = StyleSheet.create({
  pcScreen: {
    width: 100,
    alignItems: 'center',
  },
  pcScreenInner: {
    width: 100,
    height: 70,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#333',
    overflow: 'hidden',
    ...Shadows.medium,
  },
  imageCarousel: {
    flex: 1,
    width: 94,
    height: 64,
  },
  carouselContent: {
    flexDirection: 'row',
  },
  carouselImage: {
    width: 94,
    height: 64,
  },
  pcBase: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    marginTop: 2,
  },
});

export default memo(PCCarousel);
