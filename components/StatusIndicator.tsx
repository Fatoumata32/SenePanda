import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';

type StatusType = 'online' | 'offline' | 'away' | 'busy' | 'active';
type StatusSize = 'small' | 'medium' | 'large';

type StatusIndicatorProps = {
  status: StatusType;
  size?: StatusSize;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  style?: ViewStyle;
};

export default function StatusIndicator({
  status,
  size = 'medium',
  showLabel = false,
  label,
  animated = true,
  style,
}: StatusIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated && (status === 'online' || status === 'active')) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
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
  }, [animated, status]);

  const getStatusColor = (): string => {
    switch (status) {
      case 'online':
      case 'active':
        return '#10B981'; // Green
      case 'offline':
        return '#9CA3AF'; // Gray
      case 'away':
        return '#F59E0B'; // Orange
      case 'busy':
        return '#EF4444'; // Red
      default:
        return Colors.textMuted;
    }
  };

  const getStatusLabel = (): string => {
    if (label) return label;

    switch (status) {
      case 'online':
        return 'En ligne';
      case 'offline':
        return 'Hors ligne';
      case 'away':
        return 'Absent';
      case 'busy':
        return 'Occupé';
      case 'active':
        return 'Actif';
      default:
        return '';
    }
  };

  const getDotSize = (): number => {
    switch (size) {
      case 'small':
        return 8;
      case 'large':
        return 16;
      case 'medium':
      default:
        return 12;
    }
  };

  const dotSize = getDotSize();
  const statusColor = getStatusColor();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.dotContainer, { width: dotSize, height: dotSize }]}>
        {/* Pulse ring effect for online/active status */}
        {animated && (status === 'online' || status === 'active') && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                borderColor: statusColor,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.8, 0],
                }),
              },
            ]}
          />
        )}

        {/* Status dot */}
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>

      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              fontSize: size === 'small' ? 11 : size === 'large' ? Typography.fontSize.sm : 12,
              color: statusColor,
            },
          ]}>
          {getStatusLabel()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dotContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderWidth: 2,
    borderColor: Colors.white,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  label: {
    fontWeight: Typography.fontWeight.semibold,
  },
});
