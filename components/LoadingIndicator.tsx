import React, { useEffect, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  variant?: 'spinner' | 'dots' | 'panda';
  style?: ViewStyle;
}

function LoadingIndicatorComponent({
  size = 'medium',
  color = Colors.primaryOrange,
  variant = 'spinner',
  style,
}: LoadingIndicatorProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const dotAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const sizes = {
    small: { spinner: 24, dot: 6 },
    medium: { spinner: 40, dot: 8 },
    large: { spinner: 56, dot: 10 },
  };

  useEffect(() => {
    if (variant === 'spinner') {
      const animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }

    if (variant === 'dots') {
      const animations = dotAnimations.map((anim, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 150),
            Animated.timing(anim, {
              toValue: 1,
              duration: 300,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 300,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        )
      );
      animations.forEach((a) => a.start());
      return () => animations.forEach((a) => a.stop());
    }

    if (variant === 'panda') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [variant]);

  if (variant === 'spinner') {
    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.container, style]}>
        <Animated.View
          style={[
            styles.spinner,
            {
              width: sizes[size].spinner,
              height: sizes[size].spinner,
              borderColor: `${color}30`,
              borderTopColor: color,
              transform: [{ rotate: spin }],
            },
          ]}
        />
      </View>
    );
  }

  if (variant === 'dots') {
    return (
      <View style={[styles.dotsContainer, style]}>
        {dotAnimations.map((anim, index) => {
          const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.5],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: sizes[size].dot,
                  height: sizes[size].dot,
                  backgroundColor: color,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  }

  // Panda variant
  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.pandaContainer,
          {
            width: sizes[size].spinner,
            height: sizes[size].spinner,
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        <View style={[styles.pandaEar, styles.pandaEarLeft, { backgroundColor: Colors.dark }]} />
        <View style={[styles.pandaEar, styles.pandaEarRight, { backgroundColor: Colors.dark }]} />
        <View style={[styles.pandaFace, { backgroundColor: Colors.white }]}>
          <View style={[styles.pandaEye, styles.pandaEyeLeft, { backgroundColor: Colors.dark }]} />
          <View style={[styles.pandaEye, styles.pandaEyeRight, { backgroundColor: Colors.dark }]} />
          <View style={[styles.pandaNose, { backgroundColor: Colors.dark }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    borderWidth: 3,
    borderRadius: 100,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 100,
  },
  pandaContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pandaFace: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pandaEar: {
    position: 'absolute',
    width: '30%',
    height: '30%',
    borderRadius: 100,
    top: 0,
  },
  pandaEarLeft: {
    left: '5%',
  },
  pandaEarRight: {
    right: '5%',
  },
  pandaEye: {
    position: 'absolute',
    width: '20%',
    height: '20%',
    borderRadius: 100,
    top: '25%',
  },
  pandaEyeLeft: {
    left: '20%',
  },
  pandaEyeRight: {
    right: '20%',
  },
  pandaNose: {
    position: 'absolute',
    width: '15%',
    height: '10%',
    borderRadius: 3,
    bottom: '30%',
  },
});

export const LoadingIndicator = memo(LoadingIndicatorComponent);
export default LoadingIndicator;
