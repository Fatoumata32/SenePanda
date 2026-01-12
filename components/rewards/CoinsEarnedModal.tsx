import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { Coins, X, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type CoinsEarnedModalProps = {
  visible: boolean;
  coinsEarned: number;
  onClose: () => void;
  onViewRewards?: () => void;
};

export default function CoinsEarnedModal({
  visible,
  coinsEarned,
  onClose,
  onViewRewards,
}: CoinsEarnedModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const coinsAnim = useRef(new Animated.Value(0)).current;
  const [displayedCoins, setDisplayedCoins] = useState(0);

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      coinsAnim.setValue(0);
      setDisplayedCoins(0);

      // Start animations
      Animated.sequence([
        // Pop in animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        // Coin rotation
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
      ]).start();

      // Count up animation
      Animated.timing(coinsAnim, {
        toValue: coinsEarned,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      // Update displayed coins
      coinsAnim.addListener(({ value }) => {
        setDisplayedCoins(Math.floor(value));
      });

      return () => {
        coinsAnim.removeAllListeners();
      };
    }
  }, [visible, coinsEarned]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>🎉</Text>
            </View>

            <Text style={styles.title}>Félicitations!</Text>
            <Text style={styles.subtitle}>Vous avez gagné</Text>

            {/* Animated Coin */}
            <Animated.View
              style={[
                styles.coinContainer,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.coinGradient}
              >
                <Coins size={40} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            {/* Coins Count */}
            <View style={styles.coinsCountContainer}>
              <Text style={styles.coinsCount}>+{displayedCoins}</Text>
              <Text style={styles.coinsLabel}>Panda Coins</Text>
            </View>

            {/* Value Info */}
            <View style={styles.valueInfo}>
              <Text style={styles.valueText}>
                ≈ {(coinsEarned * 5).toLocaleString()} FCFA de valeur
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>Continuer</Text>
              </TouchableOpacity>
              
              {onViewRewards && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onViewRewards}
                >
                  <LinearGradient
                    colors={['#E91E63', '#C2185B']}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Voir récompenses</Text>
                    <ChevronRight size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsText}>
                💡 Utilisez vos coins pour des réductions sur vos prochains achats!
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  emojiContainer: {
    marginBottom: 12,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  coinContainer: {
    marginBottom: 16,
  },
  coinGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  coinsCountContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  coinsCount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#F59E0B',
  },
  coinsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400E',
  },
  valueInfo: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipsContainer: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  tipsText: {
    fontSize: 13,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 18,
  },
});
