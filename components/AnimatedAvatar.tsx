import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants/Colors';

interface AnimatedAvatarProps {
  imageUri: string | null;
  size?: number;
  onPress?: () => void;
  initials?: string;
  style?: ViewStyle;
  borderColor?: string;
  borderWidth?: number;
}

/**
 * Composant AnimatedAvatar
 *
 * Avatar avec animation zoom out au clic
 *
 * Animations :
 * - Zoom out rapide lors du clic (scale: 1 → 0.85 → 1)
 * - Effet de "rebond" naturel
 * - Feedback visuel immédiat
 *
 * @example
 * <AnimatedAvatar
 *   imageUri={user.avatar_url}
 *   size={100}
 *   initials="JD"
 *   onPress={() => console.log('Avatar cliqué')}
 * />
 */
export function AnimatedAvatar({
  imageUri,
  size = 80,
  onPress,
  initials = 'U',
  style,
  borderColor = Colors.primary,
  borderWidth = 3,
}: AnimatedAvatarProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  /**
   * Animation zoom out avec effet de rebond
   */
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  /**
   * Retour à la taille normale avec rebond
   */
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 80,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
            borderWidth,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.initialsContainer,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.initials,
                {
                  fontSize: size / 2.5,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {initials}
            </Animated.Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
