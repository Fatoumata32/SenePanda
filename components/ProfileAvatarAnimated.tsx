import React, { useRef, useState } from 'react';
import {
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
  View,
  ViewStyle,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProfileAvatarAnimatedProps {
  imageUri: string | null;
  size?: number;
  onPress?: () => void;
  initials?: string;
  style?: ViewStyle;
  borderColor?: string;
  borderWidth?: number;
  showBadge?: boolean;
  badgeIcon?: keyof typeof Ionicons.glyphMap;
  badgeColor?: string;
  enableZoomModal?: boolean; // Active le zoom en plein écran
  animationType?: 'scale' | 'bounce' | 'pulse'; // Type d'animation
}

/**
 * ProfileAvatarAnimated - Avatar avec animations avancées
 *
 * Fonctionnalités :
 * - Animation zoom out au clic
 * - Modal de zoom en plein écran (optionnel)
 * - Badge personnalisable (vérifié, premium, etc.)
 * - Plusieurs types d'animations
 * - Gradient de bordure (optionnel)
 *
 * @example
 * <ProfileAvatarAnimated
 *   imageUri={user.avatar_url}
 *   size={100}
 *   initials="JD"
 *   showBadge={true}
 *   badgeIcon="checkmark-circle"
 *   enableZoomModal={true}
 *   animationType="bounce"
 * />
 */
export function ProfileAvatarAnimated({
  imageUri,
  size = 100,
  onPress,
  initials = 'U',
  style,
  borderColor = Colors.primary,
  borderWidth = 3,
  showBadge = false,
  badgeIcon = 'checkmark-circle',
  badgeColor = Colors.success,
  enableZoomModal = false,
  animationType = 'bounce',
}: ProfileAvatarAnimatedProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  /**
   * Animation selon le type choisi
   */
  const animatePress = (type: 'in' | 'out') => {
    const toValue = type === 'in' ? 0.85 : 1;

    switch (animationType) {
      case 'scale':
        // Animation simple de scale
        Animated.timing(scaleAnim, {
          toValue,
          duration: 150,
          useNativeDriver: true,
        }).start();
        break;

      case 'bounce':
        // Animation avec rebond
        Animated.spring(scaleAnim, {
          toValue,
          friction: type === 'in' ? 5 : 4,
          tension: type === 'in' ? 100 : 80,
          useNativeDriver: true,
        }).start();
        break;

      case 'pulse':
        // Animation pulse (scale + légère rotation)
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: type === 'in' ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }
  };

  const handlePressIn = () => {
    animatePress('in');
  };

  const handlePressOut = () => {
    animatePress('out');
  };

  const handlePress = () => {
    if (enableZoomModal) {
      openZoomModal();
    }
    onPress?.();
  };

  /**
   * Ouvrir le modal de zoom en plein écran
   */
  const openZoomModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Fermer le modal de zoom
   */
  const closeZoomModal = () => {
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={!onPress && !enableZoomModal}
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
              transform: [
                { scale: scaleAnim },
                { rotate: animationType === 'pulse' ? rotate : '0deg' },
              ],
            },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                { width: size, height: size, borderRadius: size / 2 },
              ]}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[Colors.primary, Colors.secondary || '#FF6B6B']}
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
                  },
                ]}
              >
                {initials}
              </Animated.Text>
            </LinearGradient>
          )}

          {/* Badge (vérifié, premium, etc.) */}
          {showBadge && (
            <View
              style={[
                styles.badge,
                {
                  width: size * 0.3,
                  height: size * 0.3,
                  borderRadius: (size * 0.3) / 2,
                  backgroundColor: badgeColor,
                  bottom: size * 0.05,
                  right: size * 0.05,
                },
              ]}
            >
              <Ionicons
                name={badgeIcon}
                size={size * 0.2}
                color={Colors.white}
              />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Modal de zoom en plein écran */}
      {enableZoomModal && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={closeZoomModal}
        >
          <TouchableWithoutFeedback onPress={closeZoomModal}>
            <Animated.View
              style={[
                styles.modalOverlay,
                {
                  opacity: modalOpacity,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [{ scale: modalScale }],
                  },
                ]}
              >
                <TouchableWithoutFeedback>
                  <View style={styles.imageContainer}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.zoomedImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <LinearGradient
                        colors={[Colors.primary, Colors.secondary || '#FF6B6B']}
                        style={styles.zoomedInitials}
                      >
                        <Animated.Text style={styles.zoomedInitialsText}>
                          {initials}
                        </Animated.Text>
                      </LinearGradient>
                    )}
                  </View>
                </TouchableWithoutFeedback>

                {/* Bouton de fermeture */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeZoomModal}
                >
                  <Ionicons name="close-circle" size={40} color={Colors.white} />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  zoomedInitials: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  zoomedInitialsText: {
    color: Colors.white,
    fontSize: 80,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeButton: {
    position: 'absolute',
    top: -60,
    right: 0,
  },
});
