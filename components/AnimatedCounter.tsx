import { useEffect, useRef, useState } from 'react';
import { Text, Animated, TextStyle } from 'react-native';
import { Colors, Typography } from '@/constants/Colors';

type AnimatedCounterProps = {
  end: number;
  start?: number;
  duration?: number;
  style?: TextStyle;
  suffix?: string;
  prefix?: string;
  decimals?: number;
};

export default function AnimatedCounter({
  end,
  start = 0,
  duration = 1500,
  style,
  suffix = '',
  prefix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(start);
  const animatedValue = useRef(new Animated.Value(start)).current;

  useEffect(() => {
    animatedValue.setValue(start);

    const listener = animatedValue.addListener(({ value }) => {
      const formattedValue = decimals > 0
        ? value.toFixed(decimals)
        : Math.round(value).toString();
      setDisplayValue(parseFloat(formattedValue));
    });

    Animated.timing(animatedValue, {
      toValue: end,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [end, start, duration]);

  const formatNumber = (num: number): string => {
    if (decimals > 0) {
      return num.toFixed(decimals);
    }
    return Math.round(num).toLocaleString('fr-FR');
  };

  return (
    <Text style={[{ color: Colors.textPrimary, fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold }, style]}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </Text>
  );
}
