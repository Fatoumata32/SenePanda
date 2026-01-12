import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Coins, ChevronDown, ChevronUp, Check, Gift, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoinBalance, COINS_TO_FCFA_RATE, MIN_COINS_TO_USE, MAX_DISCOUNT_PERCENTAGE } from '@/hooks/useCoinBalance';

type CoinRedemptionProps = {
  orderTotal: number;
  onDiscountApplied: (discount: number, coinsUsed: number) => void;
  onDiscountRemoved: () => void;
  disabled?: boolean;
};

export default function CoinRedemption({
  orderTotal,
  onDiscountApplied,
  onDiscountRemoved,
  disabled = false,
}: CoinRedemptionProps) {
  const { balance, loading, canUseCoins, calculateMaxDiscount } = useCoinBalance();
  const [expanded, setExpanded] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState('');
  const [appliedCoins, setAppliedCoins] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (canUseCoins()) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [canUseCoins()]);

  if (loading || !balance) {
    return null;
  }

  const maxDiscount = calculateMaxDiscount(orderTotal);
  const maxCoinsUsable = Math.min(balance.points, Math.ceil(maxDiscount / COINS_TO_FCFA_RATE));
  const hasEnoughCoins = balance.points >= MIN_COINS_TO_USE;

  const handleApplyCoins = () => {
    const coins = parseInt(coinsToUse) || 0;
    
    if (coins < MIN_COINS_TO_USE) {
      Alert.alert(
        'Minimum requis',
        `Vous devez utiliser au moins ${MIN_COINS_TO_USE} Panda Coins (${MIN_COINS_TO_USE * COINS_TO_FCFA_RATE} FCFA de réduction).`
      );
      return;
    }

    if (coins > balance.points) {
      Alert.alert(
        'Solde insuffisant',
        `Vous n'avez que ${balance.points} Panda Coins disponibles.`
      );
      return;
    }

    if (coins > maxCoinsUsable) {
      Alert.alert(
        'Limite atteinte',
        `Vous ne pouvez utiliser que ${maxCoinsUsable} coins maximum (${MAX_DISCOUNT_PERCENTAGE}% du total).`
      );
      return;
    }

    const discount = coins * COINS_TO_FCFA_RATE;
    setAppliedCoins(coins);
    onDiscountApplied(discount, coins);
    setExpanded(false);
  };

  const handleUseMax = () => {
    setCoinsToUse(String(maxCoinsUsable));
  };

  const handleRemoveDiscount = () => {
    setAppliedCoins(0);
    setCoinsToUse('');
    onDiscountRemoved();
  };

  const handleQuickSelect = (percentage: number) => {
    const coins = Math.floor((maxCoinsUsable * percentage) / 100);
    if (coins >= MIN_COINS_TO_USE) {
      setCoinsToUse(String(coins));
    }
  };

  // Si l'utilisateur a déjà appliqué des coins
  if (appliedCoins > 0) {
    return (
      <View style={styles.appliedContainer}>
        <LinearGradient
          colors={['#FEF3C7', '#FDE68A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.appliedGradient}
        >
          <View style={styles.appliedContent}>
            <View style={styles.appliedLeft}>
              <View style={styles.appliedIconCircle}>
                <Check size={16} color="#059669" />
              </View>
              <View>
                <Text style={styles.appliedTitle}>Réduction appliquée!</Text>
                <Text style={styles.appliedDetail}>
                  {appliedCoins} coins = -{(appliedCoins * COINS_TO_FCFA_RATE).toLocaleString()} FCFA
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleRemoveDiscount}
              style={styles.removeButton}
              disabled={disabled}
            >
              <Text style={styles.removeButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Si l'utilisateur n'a pas assez de coins
  if (!hasEnoughCoins) {
    return (
      <View style={styles.notEnoughContainer}>
        <View style={styles.notEnoughContent}>
          <Coins size={20} color="#9CA3AF" />
          <View style={styles.notEnoughText}>
            <Text style={styles.notEnoughTitle}>Panda Coins</Text>
            <Text style={styles.notEnoughDetail}>
              {balance.points} coins - Il vous faut {MIN_COINS_TO_USE} coins minimum
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => !disabled && setExpanded(!expanded)}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.coinIconCircle}>
                  <Coins size={24} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Utiliser vos Panda Coins 🐼</Text>
                  <Text style={styles.headerSubtitle}>
                    {balance.points} coins = jusqu'à {maxDiscount.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>
              {expanded ? (
                <ChevronUp size={24} color="#FFFFFF" />
              ) : (
                <ChevronDown size={24} color="#FFFFFF" />
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Info Box */}
          <View style={styles.infoBox}>
            <Sparkles size={16} color="#F59E0B" />
            <Text style={styles.infoText}>
              1 coin = {COINS_TO_FCFA_RATE} FCFA • Max {MAX_DISCOUNT_PERCENTAGE}% du total
            </Text>
          </View>

          {/* Quick Select Buttons */}
          <View style={styles.quickSelectRow}>
            <TouchableOpacity
              style={styles.quickSelectButton}
              onPress={() => handleQuickSelect(25)}
            >
              <Text style={styles.quickSelectText}>25%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickSelectButton}
              onPress={() => handleQuickSelect(50)}
            >
              <Text style={styles.quickSelectText}>50%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickSelectButton}
              onPress={() => handleQuickSelect(75)}
            >
              <Text style={styles.quickSelectText}>75%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickSelectButton, styles.maxButton]}
              onPress={handleUseMax}
            >
              <Text style={[styles.quickSelectText, styles.maxButtonText]}>MAX</Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Coins size={18} color="#F59E0B" />
              <TextInput
                style={styles.input}
                value={coinsToUse}
                onChangeText={setCoinsToUse}
                keyboardType="numeric"
                placeholder={`Min ${MIN_COINS_TO_USE} coins`}
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.coinLabel}>coins</Text>
            </View>
          </View>

          {/* Preview */}
          {coinsToUse && parseInt(coinsToUse) >= MIN_COINS_TO_USE && (
            <View style={styles.previewBox}>
              <Gift size={16} color="#059669" />
              <Text style={styles.previewText}>
                Réduction: -{((parseInt(coinsToUse) || 0) * COINS_TO_FCFA_RATE).toLocaleString()} FCFA
              </Text>
            </View>
          )}

          {/* Apply Button */}
          <TouchableOpacity
            style={[
              styles.applyButton,
              (!coinsToUse || parseInt(coinsToUse) < MIN_COINS_TO_USE) && styles.applyButtonDisabled,
            ]}
            onPress={handleApplyCoins}
            disabled={!coinsToUse || parseInt(coinsToUse) < MIN_COINS_TO_USE || disabled}
          >
            <LinearGradient
              colors={
                coinsToUse && parseInt(coinsToUse) >= MIN_COINS_TO_USE
                  ? ['#059669', '#047857']
                  : ['#9CA3AF', '#6B7280']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyButtonGradient}
            >
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>Appliquer la réduction</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Balance Reminder */}
          <Text style={styles.balanceReminder}>
            Solde restant après: {Math.max(0, balance.points - (parseInt(coinsToUse) || 0))} coins
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerGradient: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  expandedContent: {
    padding: 16,
    backgroundColor: '#FFFBEB',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickSelectButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quickSelectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  maxButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  maxButtonText: {
    color: '#D97706',
  },
  inputRow: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 10,
  },
  coinLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 15,
    color: '#065F46',
    fontWeight: '600',
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  balanceReminder: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  appliedContainer: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  appliedGradient: {
    padding: 14,
  },
  appliedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appliedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  appliedDetail: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  notEnoughContainer: {
    marginVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
  },
  notEnoughContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notEnoughText: {
    flex: 1,
  },
  notEnoughTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  notEnoughDetail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
