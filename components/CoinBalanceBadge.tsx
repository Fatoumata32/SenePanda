import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Coins } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCoinBalance } from '@/hooks/useCoinBalance';
import { LinearGradient } from 'expo-linear-gradient';

type CoinBalanceBadgeProps = {
  compact?: boolean;
  showAnimation?: boolean;
  onPress?: () => void;
};

export default function CoinBalanceBadge({
  compact = false,
  showAnimation = true,
  onPress,
}: CoinBalanceBadgeProps) {
  const router = useRouter();
  const { balance, loading } = useCoinBalance();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [prevBalance, setPrevBalance] = useState(0);

  // Animation quand le solde change
  useEffect(() => {
    if (balance && balance.points !== prevBalance && showAnimation) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setPrevBalance(balance.points);
    }
  }, [balance?.points]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/rewards');
    }
  };

  if (loading || !balance) {
    return null;
  }

  if (compact) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={[styles.compactContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Coins size={16} color="#F59E0B" />
          <Text style={styles.compactText}>{balance.points}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.container}
        >
          <View style={styles.iconContainer}>
            <Coins size={18} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.balanceText}>{balance.points.toLocaleString()}</Text>
            <Text style={styles.labelText}>Coins</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  labelText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: -2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
});
