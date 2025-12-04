import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

type PandaLogoProps = {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
};

export default function PandaLogo({ size = 'medium', showText = false }: PandaLogoProps) {
  const sizeStyles = {
    small: {
      container: 60,
      textSize: 16,
    },
    medium: {
      container: 80,
      textSize: 20,
    },
    large: {
      container: 120,
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
        <Image
          source={require('@/assets/images/icon.png')}
          style={{
            width: currentSize.container,
            height: currentSize.container,
            borderRadius: currentSize.container / 2,
          }}
          resizeMode="cover"
        />
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
