import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
}

export const ConfettiAnimation = ({ show, onComplete }: { show: boolean; onComplete?: () => void }) => {
  const confettiPieces = useRef<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      // Créer 30 morceaux de confetti
      const pieces: ConfettiPiece[] = [];
      const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];

      for (let i = 0; i < 30; i++) {
        pieces.push({
          id: i,
          x: new Animated.Value(Math.random() * width),
          y: new Animated.Value(-20),
          rotation: new Animated.Value(0),
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      confettiPieces.current = pieces;

      // Animer chaque morceau
      pieces.forEach((piece, index) => {
        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 100,
            duration: 3000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: ((piece.x as any)._value || 0) + (Math.random() - 0.5) * 200,
            duration: 3000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotation, {
            toValue: Math.random() * 720,
            duration: 3000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (index === pieces.length - 1 && onComplete) {
            onComplete();
          }
        });
      });
    }
  }, [show]);

  if (!show || confettiPieces.current.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.current.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confetti,
            {
              backgroundColor: piece.color,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
