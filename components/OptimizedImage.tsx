import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ImageStyle,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';
  accessibilityLabel?: string;
}

function OptimizedImageComponent({
  source,
  style,
  resizeMode = 'cover',
  placeholder,
  onLoad,
  onError,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  accessibilityLabel,
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleLoad = useCallback(() => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    onLoad?.();
  }, [fadeAnim, onLoad]);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    onError?.();
  }, [onError]);

  const imageSource = typeof source === 'number'
    ? source
    : { uri: source.uri };

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder/Loading */}
      {loading && (
        <View style={[styles.placeholder, style]}>
          {placeholder ? (
            <Image
              source={{ uri: placeholder }}
              style={[styles.placeholderImage, style]}
              resizeMode={resizeMode}
            />
          ) : (
            <ActivityIndicator size="small" color={Colors.primary} />
          )}
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={[styles.errorContainer, style]}>
          <View style={styles.errorIcon}>
            <View style={styles.errorIconInner} />
          </View>
        </View>
      )}

      {/* Actual image */}
      {!error && (
        <Animated.Image
          source={imageSource}
          style={[
            styles.image,
            style,
            { opacity: fadeAnim },
          ]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          accessibilityLabel={accessibilityLabel}
          accessible={!!accessibilityLabel}
        />
      )}
    </View>
  );
}

// Memoized export for performance
const OptimizedImage = memo(OptimizedImageComponent);
export default OptimizedImage;

// Optimized image for product cards
export function ProductImage({
  uri,
  style,
}: {
  uri: string;
  style?: any;
}) {
  // Add Cloudflare image optimization params if available
  const optimizedUri = uri.includes('cloudflare')
    ? `${uri}?width=400&quality=80&format=webp`
    : uri;

  return (
    <OptimizedImage
      source={{ uri: optimizedUri }}
      style={style}
      resizeMode="cover"
    />
  );
}

// Avatar image with fallback
export function AvatarImage({
  uri,
  name,
  size = 50,
  style,
}: {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: any;
}) {
  if (!uri) {
    const initial = name?.charAt(0)?.toUpperCase() || '?';
    return (
      <View
        style={[
          styles.avatarFallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      >
        <Animated.Text
          style={[
            styles.avatarInitial,
            { fontSize: size * 0.4 },
          ]}
        >
          {initial}
        </Animated.Text>
      </View>
    );
  }

  return (
    <OptimizedImage
      source={{ uri }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9CA3AF',
  },
  avatarFallback: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
