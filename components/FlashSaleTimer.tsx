import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Clock, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface FlashSaleTimerProps {
  endTime: string | Date;
  onExpire?: () => void;
  showIcon?: boolean;
  compact?: boolean;
}

export function FlashSaleTimer({
  endTime,
  onExpire,
  showIcon = true,
  compact = false,
}: FlashSaleTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, expired: false };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Haptic feedback when less than 1 minute
      if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 30) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      if (newTimeLeft.expired) {
        clearInterval(timer);
        onExpire?.();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (timeLeft.expired) {
    return (
      <View style={[styles.container, styles.expiredContainer]}>
        <Text style={styles.expiredText}>Vente Flash Terminée</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {showIcon && <Zap size={14} color={Colors.primaryOrange} />}
        <Text style={styles.compactText}>
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showIcon && (
        <View style={styles.iconContainer}>
          <Zap size={20} color={Colors.primaryOrange} />
        </View>
      )}

      <View style={styles.timerContainer}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{String(timeLeft.hours).padStart(2, '0')}</Text>
          <Text style={styles.timeLabel}>H</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
          <Text style={styles.timeLabel}>M</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{String(timeLeft.seconds).padStart(2, '0')}</Text>
          <Text style={styles.timeLabel}>S</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryOrange,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  iconContainer: {
    marginRight: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 32,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: -2,
  },
  separator: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginHorizontal: 2,
  },
  expiredContainer: {
    backgroundColor: Colors.textMuted,
  },
  expiredText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 6,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },
});

export default FlashSaleTimer;
