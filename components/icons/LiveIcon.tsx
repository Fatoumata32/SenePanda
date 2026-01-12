import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LiveIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
  animated?: boolean;
}

export default function LiveIcon({
  size = 24,
  color = '#999',
  focused = false,
  animated = false
}: LiveIconProps) {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  return (
    <Animated.View style={[styles.container, animated && { transform: [{ scale: pulseAnim }] }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="liveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF6B6B" />
            <Stop offset="50%" stopColor="#FF8C42" />
            <Stop offset="100%" stopColor="#FFD93D" />
          </LinearGradient>
        </Defs>

        {/* Caméra vidéo */}
        <Path
          d="M23 7l-7 5 7 5V7z"
          fill={focused ? 'url(#liveGradient)' : 'none'}
          stroke={focused ? 'none' : color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M15 5H3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2z"
          fill={focused ? 'url(#liveGradient)' : 'none'}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Point LIVE en haut à droite */}
        {focused && (
          <Circle
            cx="20"
            cy="4"
            r="3"
            fill="#EF4444"
            stroke="#fff"
            strokeWidth="1.5"
          />
        )}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
