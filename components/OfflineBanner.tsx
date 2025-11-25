import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, Wifi } from 'lucide-react-native';

export default function OfflineBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-60));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? true;

      if (!connected && isConnected) {
        // Lost connection
        setIsConnected(false);
        setShowBanner(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      } else if (connected && !isConnected) {
        // Regained connection
        setIsConnected(true);
        // Show "back online" message briefly
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -60,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowBanner(false);
          });
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  if (!showBanner) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: isConnected ? '#10B981' : '#EF4444',
        },
      ]}
    >
      {isConnected ? (
        <>
          <Wifi size={18} color="#FFFFFF" />
          <Text style={styles.text}>Connexion rétablie</Text>
        </>
      ) : (
        <>
          <WifiOff size={18} color="#FFFFFF" />
          <Text style={styles.text}>Pas de connexion internet</Text>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 9999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
