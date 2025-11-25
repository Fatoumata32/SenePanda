import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

/**
 * Memoized action button component
 */
interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  backgroundColor: string;
  iconColor: string;
  textColor: string;
}

export const ActionButton = memo<ActionButtonProps>(({
  icon: Icon,
  label,
  onPress,
  backgroundColor,
  iconColor,
  textColor,
}) => {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor }]}>
        <Icon size={24} color={iconColor} />
      </View>
      <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.label === nextProps.label &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    prevProps.iconColor === nextProps.iconColor &&
    prevProps.textColor === nextProps.textColor
  );
});

ActionButton.displayName = 'ActionButton';

/**
 * Memoized info row component
 */
interface InfoRowProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
}

export const InfoRow = memo<InfoRowProps>(({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  labelColor,
  valueColor,
}) => {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconCircle, { backgroundColor: iconBg }]}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
});

InfoRow.displayName = 'InfoRow';

const styles = StyleSheet.create({
  actionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
});
