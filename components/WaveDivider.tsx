import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

type WaveVariant = 'wave' | 'curve' | 'double-wave' | 'smooth';

type WaveDividerProps = {
  backgroundColor?: string;
  waveColor?: string;
  height?: number;
  variant?: WaveVariant;
  animated?: boolean;
};

export default function WaveDivider({
  backgroundColor = Colors.backgroundLemon,
  waveColor = Colors.white,
  height = 60,
  variant = 'wave',
  animated = true,
}: WaveDividerProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const getWavePath = (): string => {
    switch (variant) {
      case 'smooth':
        return "M0,50 C240,30 480,30 720,50 C960,70 1200,70 1440,50 L1440,120 L0,120 Z";
      case 'curve':
        return "M0,60 Q720,20 1440,60 L1440,120 L0,120 Z";
      case 'double-wave':
        return "M0,45 Q360,25 720,45 T1440,45 L1440,120 L0,120 Z";
      case 'wave':
      default:
        return "M0,40 Q360,20 720,40 T1440,40 L1440,120 L0,120 Z";
    }
  };

  const getSecondWavePath = (): string => {
    if (variant === 'double-wave') {
      return "M0,60 Q360,80 720,60 T1440,60 L1440,120 L0,120 Z";
    }
    return "";
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { height },
        animated && {
          transform: [{
            translateX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 10],
            }),
          }],
        },
      ]}>
      <Svg
        height="100%"
        width="100%"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none">
        <Defs>
          {/* Gradient vertical pour transition douce */}
          <SvgLinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={backgroundColor} stopOpacity="1" />
            <Stop offset="0.5" stopColor={backgroundColor} stopOpacity="0.8" />
            <Stop offset="1" stopColor={waveColor} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        {/* Fond avec gradient amélioré */}
        <Path
          fill="url(#waveGradient)"
          d="M0,0 L1440,0 L1440,120 L0,120 Z"
        />

        {/* Vague secondaire pour effet double (si variant = double-wave) */}
        {variant === 'double-wave' && (
          <Path
            fill={waveColor}
            fillOpacity="0.5"
            d={getSecondWavePath()}
          />
        )}

        {/* Vague principale */}
        <Path
          fill={waveColor}
          d={getWavePath()}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: -1,
    marginBottom: -1,
    overflow: 'hidden',
  },
});
