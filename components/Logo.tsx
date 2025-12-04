import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  withText?: boolean;
}

export default function Logo({ size = 120, withText = false }: LogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/logo-senepanda.jpg')}
        style={[
          styles.logo,
          {
            width: size,
            height: withText ? size * 1.5 : size,
            borderRadius: withText ? 0 : size / 2,
          }
        ]}
        resizeMode={withText ? 'contain' : 'cover'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Les dimensions sont définies dynamiquement via les props
  },
});
