import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type PandaLogoProps = {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
};

export default function PandaLogo({ size = 'medium', showText = true }: PandaLogoProps) {
  const sizeStyles = {
    small: {
      container: 60,
      fontSize: 32,
      textSize: 16,
    },
    medium: {
      container: 80,
      fontSize: 42,
      textSize: 20,
    },
    large: {
      container: 120,
      fontSize: 64,
      textSize: 28,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.logoContainer,
          {
            width: currentSize.container,
            height: currentSize.container,
          },
        ]}>
        <Text style={[styles.panda, { fontSize: currentSize.fontSize }]}>
          🐼
        </Text>
      </View>
      {showText && (
        <Text style={[styles.brandText, { fontSize: currentSize.textSize }]}>
          sene<Text style={styles.brandHighlight}>panda</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    borderRadius: 1000,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D97706',
  },
  panda: {
    textAlign: 'center',
  },
  brandText: {
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    letterSpacing: 1,
  },
  brandHighlight: {
    color: '#D97706',
  },
});
