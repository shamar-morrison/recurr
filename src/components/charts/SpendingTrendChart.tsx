import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { formatMoney } from '@/src/utils/formatMoney';
import { SpendingDataPoint } from '@/src/utils/spendingCalculations';

interface SpendingTrendChartProps {
  data: SpendingDataPoint[];
  currency: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = SPACING.lg * 2;

export function SpendingTrendChart({ data, currency }: SpendingTrendChartProps) {
  const { colors, isDark } = useTheme();

  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    return data.map((point) => ({
      value: point.amount,
      label: point.month,
      dataPointText: '',
    }));
  }, [data]);

  const { maxValue, totalSpending, averageSpending } = useMemo(() => {
    if (data.length === 0) {
      return { maxValue: 100, totalSpending: 0, averageSpending: 0 };
    }
    const values = data.map((d) => d.amount);
    const max = Math.max(...values);
    const total = values.reduce((sum, val) => sum + val, 0);
    return {
      maxValue: max > 0 ? max * 1.2 : 100,
      totalSpending: total,
      averageSpending: total / data.length,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Spending Trend</Text>
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
          No trend data available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Spending Trend</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Total</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatMoney(totalSpending, currency, true)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Avg/mo</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatMoney(averageSpending, currency, true)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - CHART_PADDING - 60}
          height={160}
          spacing={(SCREEN_WIDTH - CHART_PADDING - 100) / Math.max(1, data.length - 1)}
          initialSpacing={10}
          endSpacing={0}
          color={colors.primary}
          thickness={3}
          startFillColor={colors.primary}
          endFillColor={isDark ? 'rgba(124, 92, 255, 0.05)' : 'rgba(94, 56, 248, 0.05)'}
          startOpacity={0.3}
          endOpacity={0}
          areaChart
          curved
          hideDataPoints={data.length > 12}
          dataPointsColor={colors.primary}
          dataPointsRadius={4}
          xAxisColor={colors.border}
          xAxisThickness={1}
          yAxisThickness={0}
          yAxisTextStyle={{ color: colors.secondaryText, fontSize: 10 }}
          xAxisLabelTextStyle={{
            color: colors.secondaryText,
            fontSize: 10,
            fontWeight: '500',
          }}
          hideRules
          noOfSections={4}
          maxValue={maxValue}
          isAnimated
          animationDuration={800}
          pointerConfig={{
            pointerStripHeight: 140,
            pointerStripColor: colors.border,
            pointerStripWidth: 1,
            pointerColor: colors.primary,
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 50,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: Array<{ value: number }>) => {
              return (
                <View
                  style={[
                    styles.tooltip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.tooltipText, { color: colors.text }]}>
                    {formatMoney(items[0]?.value ?? 0, currency)}
                  </Text>
                </View>
              );
            },
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  stat: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  chartWrapper: {
    marginLeft: -SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    paddingVertical: SPACING.xxl,
  },
  tooltip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  tooltipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
