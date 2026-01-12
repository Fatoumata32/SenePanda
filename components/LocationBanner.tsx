import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, RefreshCw, Navigation } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSmartLocation } from '@/hooks/useSmartLocation';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/Colors';

interface LocationBannerProps {
  onLocationChange?: (latitude: number, longitude: number) => void;
}

export default function LocationBanner({ onLocationChange }: LocationBannerProps) {
  const router = useRouter();
  const {
    location,
    isLoading,
    neighborhood,
    neighborhoodEmoji,
    displayText,
    zoneInfo,
    requestLocation,
  } = useSmartLocation(true, true);

  const handleRefresh = async () => {
    await requestLocation(true); // Force refresh
    if (location && onLocationChange) {
      onLocationChange(location.coords.latitude, location.coords.longitude);
    }
  };

  const handleChangeLocation = () => {
    router.push('/settings/edit-location' as any);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#F59E0B" />
          <Text style={styles.loadingText}>Localisation en cours...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleChangeLocation}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#FEF3C7', '#FDE68A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Icône et localisation */}
        <View style={styles.locationInfo}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <MapPin size={18} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.label}>Votre localisation</Text>
            <View style={styles.locationRow}>
              <Text style={styles.location}>
                {neighborhoodEmoji} {displayText}
              </Text>
              {zoneInfo && (
                <View style={[styles.zoneBadge, {
                  backgroundColor: zoneInfo.deliverySpeed === 'fast' ? '#DCFCE7' : '#FEF3C7'
                }]}>
                  <Text style={[styles.zoneBadgeText, {
                    color: zoneInfo.deliverySpeed === 'fast' ? '#16A34A' : '#D97706'
                  }]}>
                    {zoneInfo.deliverySpeed === 'fast' ? '⚡ Rapide' : '🚚 Normal'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bouton refresh */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RefreshCw size={18} color="#D97706" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Indicateur de changement de localisation */}
      <View style={styles.changeHint}>
        <Navigation size={12} color="#92400E" strokeWidth={2} />
        <Text style={styles.changeHintText}>Toucher pour changer</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    ...Shadows.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  locationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  location: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: '#78350F',
  },
  zoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  zoneBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(146, 64, 14, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(146, 64, 14, 0.2)',
  },
  changeHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#D97706',
  },
});