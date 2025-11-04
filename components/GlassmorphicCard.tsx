import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/Colors';

type GlassmorphicCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  bordered?: boolean;
};

export default function GlassmorphicCard({
  children,
  style,
  intensity = 40,
  tint = 'light',
  bordered = true,
}: GlassmorphicCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.25)',
            'rgba(255, 255, 255, 0.1)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>

      {bordered && (
        <View style={styles.border} />
      )}

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.large,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    padding: Spacing.lg,
  },
});
