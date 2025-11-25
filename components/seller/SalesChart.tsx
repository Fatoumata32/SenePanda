import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 200;

export interface SalesData {
  date: string;
  amount: number;
  orders: number;
}

interface SalesChartProps {
  data: SalesData[];
  period: 'day' | 'week' | 'month' | 'year';
  onPeriodChange?: (period: 'day' | 'week' | 'month' | 'year') => void;
}

export function SalesChart({ data, period, onPeriodChange }: SalesChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSales = data.reduce((sum, item) => sum + item.amount, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Compare with previous period
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint);
    const secondHalf = data.slice(midPoint);

    const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.amount, 0);
    const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.amount, 0);

    const growth = firstHalfTotal > 0
      ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100
      : 0;

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      growth,
    };
  }, [data]);

  // Calculate chart points
  const chartPoints = useMemo(() => {
    if (data.length === 0) return [];

    const maxAmount = Math.max(...data.map(d => d.amount), 1);
    const padding = 20;

    return data.map((item, index) => {
      const x = (index / (data.length - 1)) * (CHART_WIDTH - padding * 2) + padding;
      const y = CHART_HEIGHT - ((item.amount / maxAmount) * (CHART_HEIGHT - padding * 2)) - padding;

      return { x, y, ...item };
    });
  }, [data]);

  // Create SVG path
  const linePath = useMemo(() => {
    if (chartPoints.length === 0) return '';

    const path = chartPoints.map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x} ${point.y}`;
    }).join(' ');

    return path;
  }, [chartPoints]);

  // Create area path
  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';

    const path = [
      `M ${chartPoints[0].x} ${CHART_HEIGHT}`,
      ...chartPoints.map(point => `L ${point.x} ${point.y}`),
      `L ${chartPoints[chartPoints.length - 1].x} ${CHART_HEIGHT}`,
      'Z'
    ].join(' ');

    return path;
  }, [chartPoints]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (period) {
      case 'day':
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      case 'week':
        return `S${Math.ceil(date.getDate() / 7)}`;
      case 'month':
        return date.toLocaleDateString('fr-FR', { month: 'short' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Ventes Totales</Text>
          <Text style={styles.statValue}>{formatAmount(stats.totalSales)}</Text>
          <View style={styles.growthContainer}>
            {stats.growth >= 0 ? (
              <TrendingUp size={16} color={Colors.successGreen} />
            ) : (
              <TrendingDown size={16} color={Colors.error} />
            )}
            <Text style={[
              styles.growthText,
              { color: stats.growth >= 0 ? Colors.successGreen : Colors.error }
            ]}>
              {Math.abs(stats.growth).toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Commandes</Text>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statSubtext}>
            Moy: {formatAmount(stats.avgOrderValue)}
          </Text>
        </View>
      </View>

      {/* Period Selector */}
      {onPeriodChange && (
        <View style={styles.periodSelector}>
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && styles.periodButtonActive
              ]}
              onPress={() => onPeriodChange(p)}
            >
              <Text style={[
                styles.periodButtonText,
                period === p && styles.periodButtonTextActive
              ]}>
                {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chart */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chartScroll}
      >
        <View style={styles.chartContainer}>
          {/* Grid lines */}
          <View style={styles.gridLines}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          {/* Simple line chart using borders */}
          <View style={styles.lineContainer}>
            {chartPoints.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = chartPoints[index - 1];
              const distance = Math.sqrt(
                Math.pow(point.x - prevPoint.x, 2) +
                Math.pow(point.y - prevPoint.y, 2)
              );
              const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * (180 / Math.PI);

              return (
                <View
                  key={index}
                  style={[
                    styles.lineSegment,
                    {
                      position: 'absolute',
                      left: prevPoint.x,
                      top: prevPoint.y,
                      width: distance,
                      transform: [{ rotate: `${angle}deg` }],
                    }
                  ]}
                />
              );
            })}
          </View>

          {/* Data points */}
          {chartPoints.map((point, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dataPoint,
                {
                  left: point.x - 6,
                  top: point.y - 6,
                },
                selectedPoint === index && styles.dataPointActive
              ]}
              onPress={() => setSelectedPoint(selectedPoint === index ? null : index)}
            >
              {selectedPoint === index && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipDate}>{formatDate(point.date)}</Text>
                  <Text style={styles.tooltipAmount}>{formatAmount(point.amount)}</Text>
                  <Text style={styles.tooltipOrders}>{point.orders} commandes</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* X-axis labels */}
          <View style={styles.xAxisLabels}>
            {chartPoints.filter((_, i) => i % Math.ceil(chartPoints.length / 6) === 0).map((point, index) => (
              <Text
                key={index}
                style={[styles.xAxisLabel, { left: point.x - 20 }]}
              >
                {formatDate(point.date)}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    padding: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primaryOrange,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  periodButtonTextActive: {
    color: Colors.white,
  },
  chartScroll: {
    marginHorizontal: -16,
  },
  chartContainer: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT + 40,
    paddingHorizontal: 16,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 20,
    bottom: 40,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  lineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 40,
  },
  lineSegment: {
    height: 2,
    backgroundColor: Colors.primaryOrange,
  },
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primaryOrange,
  },
  dataPointActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    left: -2,
    top: -2,
  },
  tooltip: {
    position: 'absolute',
    bottom: 20,
    left: -40,
    backgroundColor: Colors.dark,
    padding: 8,
    borderRadius: 8,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipDate: {
    fontSize: 10,
    color: Colors.white,
    opacity: 0.8,
  },
  tooltipAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginVertical: 2,
  },
  tooltipOrders: {
    fontSize: 10,
    color: Colors.white,
    opacity: 0.8,
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  xAxisLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: 11,
    color: Colors.textMuted,
    width: 40,
    textAlign: 'center',
  },
});

export default SalesChart;
