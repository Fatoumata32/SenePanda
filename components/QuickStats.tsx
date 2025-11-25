import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { formatNumber } from '@/lib/formatters';
import * as Haptics from 'expo-haptics';

interface Stat {
  id: string;
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
}

interface QuickStatsProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'compact' | 'card';
}

function QuickStatsComponent({
  stats,
  columns = 3,
  variant = 'default',
}: QuickStatsProps) {
  const handlePress = (stat: Stat) => {
    if (stat.onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      stat.onPress();
    }
  };

  const renderStat = (stat: Stat) => {
    const content = (
      <>
        {stat.icon && <View style={styles.iconContainer}>{stat.icon}</View>}

        <Text style={[styles.value, variant === 'compact' && styles.valueCompact]}>
          {typeof stat.value === 'number' ? formatNumber(stat.value, { compact: true }) : stat.value}
        </Text>

        <Text style={[styles.label, variant === 'compact' && styles.labelCompact]} numberOfLines={1}>
          {stat.label}
        </Text>

        {stat.trend && (
          <View style={styles.trendContainer}>
            <Text
              style={[
                styles.trend,
                stat.trend.isPositive ? styles.trendPositive : styles.trendNegative,
              ]}
            >
              {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
            </Text>
          </View>
        )}
      </>
    );

    if (stat.onPress) {
      return (
        <TouchableOpacity
          key={stat.id}
          style={[
            styles.stat,
            variant === 'card' && styles.statCard,
            { width: `${100 / columns}%` },
          ]}
          onPress={() => handlePress(stat)}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={`${stat.label}: ${stat.value}`}
          accessibilityRole="button"
        >
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <View
        key={stat.id}
        style={[
          styles.stat,
          variant === 'card' && styles.statCard,
          { width: `${100 / columns}%` },
        ]}
        accessible={true}
        accessibilityLabel={`${stat.label}: ${stat.value}`}
      >
        {content}
      </View>
    );
  };

  return (
    <View style={[styles.container, variant === 'card' && styles.containerCard]}>
      {stats.map(renderStat)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  containerCard: {
    gap: 12,
    padding: 4,
  },
  stat: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  valueCompact: {
    fontSize: 16,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 10,
  },
  trendContainer: {
    marginTop: 4,
  },
  trend: {
    fontSize: 11,
    fontWeight: '600',
  },
  trendPositive: {
    color: Colors.success,
  },
  trendNegative: {
    color: Colors.error,
  },
});

export const QuickStats = memo(QuickStatsComponent);
export default QuickStats;
