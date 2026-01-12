import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, Truck, DollarSign } from 'lucide-react-native';
import { DeliveryEstimate } from '@/lib/smartGeolocation';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/Colors';

interface DeliveryEstimateCardProps {
  estimate: DeliveryEstimate;
  sellerName?: string;
  compact?: boolean;
}

export default function DeliveryEstimateCard({
  estimate,
  sellerName,
  compact = false,
}: DeliveryEstimateCardProps) {
  if (!estimate.canDeliver) {
    return (
      <View style={[styles.container, styles.containerError]}>
        <View style={styles.header}>
          <Truck size={20} color="#EF4444" strokeWidth={2.5} />
          <Text style={styles.errorTitle}>Livraison non disponible</Text>
        </View>
        <Text style={styles.errorText}>{estimate.reason}</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactItem}>
          <MapPin size={14} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.compactText}>{estimate.distanceFormatted}</Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactItem}>
          <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.compactText}>{estimate.estimatedTimeText}</Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactItem}>
          <DollarSign size={14} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.compactText}>{estimate.deliveryFee} F</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {sellerName && (
        <View style={styles.header}>
          <Truck size={20} color="#F59E0B" strokeWidth={2.5} />
          <Text style={styles.headerText}>Livraison depuis {sellerName}</Text>
        </View>
      )}

      <View style={styles.grid}>
        {/* Distance */}
        <View style={styles.gridItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
            <MapPin size={18} color="#2563EB" strokeWidth={2.5} />
          </View>
          <Text style={styles.gridLabel}>Distance</Text>
          <Text style={styles.gridValue}>{estimate.distanceFormatted}</Text>
        </View>

        {/* Temps */}
        <View style={styles.gridItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Clock size={18} color="#16A34A" strokeWidth={2.5} />
          </View>
          <Text style={styles.gridLabel}>Temps estimé</Text>
          <Text style={styles.gridValue}>{estimate.estimatedTimeText}</Text>
        </View>

        {/* Frais */}
        <View style={styles.gridItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <DollarSign size={18} color="#D97706" strokeWidth={2.5} />
          </View>
          <Text style={styles.gridLabel}>Frais</Text>
          <Text style={styles.gridValue}>{estimate.deliveryFee} FCFA</Text>
        </View>
      </View>

      {/* Badge de livraison rapide */}
      {estimate.estimatedMinutes < 30 && (
        <View style={styles.badge}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badgeGradient}
          >
            <Text style={styles.badgeText}>⚡ Livraison Express</Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerError: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  errorTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#EF4444',
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: '#DC2626',
    marginTop: Spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  gridValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  badge: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  badgeGradient: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  compactDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
  },
});