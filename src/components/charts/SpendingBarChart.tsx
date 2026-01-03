import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { formatMoney } from '@/src/utils/formatMoney';
import { SpendingDataPoint } from '@/src/utils/spendingCalculations';

interface SpendingBarChartProps {
  data: SpendingDataPoint[];
  currency: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = SPACING.lg * 2;

export function SpendingBarChart({ data, currency }: SpendingBarChartProps) {
  const { colors } = useTheme();

  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    return data.map((point) => ({
      value: point.amount,
      label: point.month,
      frontColor: colors.primary,
      topLabelComponent: () => (
        <Text style={[styles.barLabel, { color: colors.secondaryText }]}>
          {formatMoney(point.amount, currency, true)}
        </Text>
      ),
    }));
  }, [data, colors, currency]);

  const maxValue = useMemo(() => {
    if (data.length === 0) return 100;
    const max = Math.max(...data.map((d) => d.amount));
    return max > 0 ? max * 1.2 : 100; // Add 20% headroom
  }, [data]);

  if (data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Monthly Spending</Text>
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
          No spending data available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Monthly Spending</Text>
      <View style={styles.chartWrapper}>
        <BarChart
          data={chartData}
          barWidth={Math.min(
            32,
            Math.max(16, (SCREEN_WIDTH - CHART_PADDING - 60) / data.length - 12)
          )}
          spacing={8}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={1}
          xAxisColor={colors.border}
          yAxisThickness={0}
          yAxisTextStyle={{ color: colors.secondaryText, fontSize: 10 }}
          noOfSections={4}
          maxValue={maxValue}
          isAnimated
          animationDuration={500}
          barBorderRadius={4}
          frontColor={colors.primary}
          xAxisLabelTextStyle={{
            color: colors.secondaryText,
            fontSize: 10,
            fontWeight: '500',
          }}
          height={180}
          showValuesAsTopLabel={false}
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
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  chartWrapper: {
    marginLeft: -SPACING.md,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    paddingVertical: SPACING.xxl,
  },
});
