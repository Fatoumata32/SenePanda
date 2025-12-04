import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, ClipPath, Path, Image as SvgImage, LinearGradient as SvgLinearGradient, Stop, Circle, Rect } from 'react-native-svg';

export type AvatarShape = 'teardrop' | 'circle' | 'hexagon' | 'squircle' | 'shield' | 'diamond';

interface TeardropAvatarProps {
  imageUri?: string | null;
  size?: number;
  children?: React.ReactNode;
  glowColor?: string[];
  style?: ViewStyle;
  shape?: AvatarShape;
  borderWidth?: number;
  borderColor?: string;
}

export default function TeardropAvatar({
  imageUri,
  size = 140,
  children,
  glowColor = ['#93C5FD', '#60A5FA'],
  style,
  shape = 'squircle',
  borderWidth = 0,
  borderColor = '#FFFFFF',
}: TeardropAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Calculer les dimensions
  const avatarSize = size;

  // Fonction pour générer le path selon la forme
  const getShapePath = (): string => {
    const s = avatarSize;

    switch (shape) {
      case 'circle':
        return `M ${s/2},0 A ${s/2},${s/2} 0 1,1 ${s/2},${s} A ${s/2},${s/2} 0 1,1 ${s/2},0 Z`;

      case 'hexagon':
        return `
          M ${s * 0.5},${s * 0.05}
          L ${s * 0.93},${s * 0.27}
          L ${s * 0.93},${s * 0.73}
          L ${s * 0.5},${s * 0.95}
          L ${s * 0.07},${s * 0.73}
          L ${s * 0.07},${s * 0.27}
          Z
        `;

      case 'squircle':
        // Superellipse moderne (iOS-style)
        const r = s * 0.28; // Rayon de courbure
        return `
          M ${s * 0.5},0
          C ${s * 0.72},0 ${s * 0.85},0 ${s},${s * 0.15}
          C ${s},${s * 0.28} ${s},${s * 0.5} ${s},${s * 0.5}
          C ${s},${s * 0.72} ${s},${s * 0.85} ${s},${s * 0.85}
          C ${s * 0.85},${s} ${s * 0.72},${s} ${s * 0.5},${s}
          C ${s * 0.28},${s} ${s * 0.15},${s} ${s * 0.15},${s}
          C 0,${s * 0.85} 0,${s * 0.72} 0,${s * 0.5}
          C 0,${s * 0.28} 0,${s * 0.15} 0,${s * 0.15}
          C ${s * 0.15},0 ${s * 0.28},0 ${s * 0.5},0
          Z
        `;

      case 'shield':
        return `
          M ${s * 0.5},${s * 0.02}
          C ${s * 0.15},${s * 0.02} ${s * 0.05},${s * 0.15} ${s * 0.05},${s * 0.35}
          L ${s * 0.05},${s * 0.65}
          C ${s * 0.05},${s * 0.80} ${s * 0.20},${s * 0.92} ${s * 0.5},${s * 0.98}
          C ${s * 0.80},${s * 0.92} ${s * 0.95},${s * 0.80} ${s * 0.95},${s * 0.65}
          L ${s * 0.95},${s * 0.35}
          C ${s * 0.95},${s * 0.15} ${s * 0.85},${s * 0.02} ${s * 0.5},${s * 0.02}
          Z
        `;

      case 'diamond':
        return `
          M ${s * 0.5},${s * 0.05}
          L ${s * 0.92},${s * 0.5}
          L ${s * 0.5},${s * 0.95}
          L ${s * 0.08},${s * 0.5}
          Z
        `;

      case 'teardrop':
      default:
        return `
          M ${s * 0.5},${s * 0.02}
          C ${s * 0.22},${s * 0.02} ${s * 0.02},${s * 0.22} ${s * 0.02},${s * 0.5}
          C ${s * 0.02},${s * 0.72} ${s * 0.15},${s * 0.88} ${s * 0.35},${s * 0.95}
          C ${s * 0.48},${s * 0.99} ${s * 0.62},${s * 0.98} ${s * 0.75},${s * 0.88}
          C ${s * 0.85},${s * 0.80} ${s * 0.92},${s * 0.68} ${s * 0.96},${s * 0.52}
          C ${s * 0.98},${s * 0.42} ${s * 1.02},${s * 0.28} ${s * 1.05},${s * 0.18}
          C ${s * 0.98},${s * 0.08} ${s * 0.88},${s * 0.02} ${s * 0.75},${s * 0.02}
          C ${s * 0.65},${s * 0.02} ${s * 0.5},${s * 0.02} ${s * 0.5},${s * 0.02}
          Z
        `;
    }
  };

  const shapePath = getShapePath();

  // Vérifier si on doit afficher l'image
  const showImage = imageUri && !imageError;

  // Pour la forme circle, utiliser directement Image de React Native
  if (shape === 'circle') {
    return (
      <View style={[styles.container, style]}>
        <View
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            overflow: 'hidden',
            borderWidth: borderWidth,
            borderColor: borderColor,
          }}
        >
          {showImage ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: avatarSize - borderWidth * 2,
                height: avatarSize - borderWidth * 2,
              }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <LinearGradient
              colors={glowColor as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: avatarSize - borderWidth * 2,
                height: avatarSize - borderWidth * 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {children}
            </LinearGradient>
          )}
        </View>
      </View>
    );
  }

  // Pour les autres formes, utiliser SVG
  return (
    <View style={[styles.container, style]}>
      {/* Avatar Container */}
      <View
        style={{
          width: avatarSize,
          height: avatarSize,
        }}
      >
        <Svg width={avatarSize} height={avatarSize} viewBox={`0 0 ${avatarSize} ${avatarSize}`}>
          <Defs>
            <ClipPath id="shapeClip">
              <Path d={shapePath} />
            </ClipPath>
            <SvgLinearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={glowColor[0]} />
              <Stop offset="100%" stopColor={glowColor[1]} />
            </SvgLinearGradient>
          </Defs>

          {/* Bordure (si activée) */}
          {borderWidth > 0 && (
            <Path
              d={shapePath}
              fill="none"
              stroke={borderColor}
              strokeWidth={borderWidth}
            />
          )}

          {/* Image ou gradient */}
          {showImage ? (
            <SvgImage
              href={{ uri: imageUri }}
              width={avatarSize}
              height={avatarSize}
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#shapeClip)"
            />
          ) : (
            <Path d={shapePath} fill="url(#avatarGradient)" />
          )}
        </Svg>

        {/* Afficher le placeholder/children si pas d'image */}
        {!showImage && (
          <View style={[styles.placeholderContainer, { width: avatarSize, height: avatarSize }]} pointerEvents="none">
            {children}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    position: 'absolute',
    backgroundColor: '#E5E7EB', // Gris clair
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
