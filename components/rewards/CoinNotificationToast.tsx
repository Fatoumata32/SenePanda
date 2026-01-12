import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Coins } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const { width } = Dimensions.get('window');

type CoinNotification = {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  description?: string;
};

export default function CoinNotificationToast() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CoinNotification[]>([]);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const currentNotification = notifications[0];

  useEffect(() => {
    if (!user) return;

    // Subscribe to points_transactions for this user
    const channel = supabase
      .channel(`coin-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const transaction = payload.new as any;
          console.log('🪙 New coin transaction:', transaction);
          
          const notification: CoinNotification = {
            id: transaction.id,
            amount: Math.abs(transaction.points),
            type: transaction.points > 0 ? 'earned' : 'spent',
            description: transaction.description,
          };

          setNotifications(prev => [...prev, notification]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Show notification animation
  useEffect(() => {
    if (currentNotification) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setNotifications(prev => prev.slice(1));
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentNotification]);

  if (!currentNotification) return null;

  const isEarned = currentNotification.type === 'earned';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: isEarned ? '#10B981' : '#EF4444',
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Coins size={20} color="#FFFFFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {isEarned ? '+' : '-'}{currentNotification.amount} PandaCoins
        </Text>
        {currentNotification.description && (
          <Text style={styles.description} numberOfLines={1}>
            {currentNotification.description}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    maxWidth: width - 40,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
