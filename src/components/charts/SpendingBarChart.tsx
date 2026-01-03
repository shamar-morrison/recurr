import React, { useCallback, useMemo, useState } from 'react';
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
const Y_AXIS_WIDTH = 60; // Estimated width for Y-axis labels
const BAR_SPACING = 12; // Space between bars

export function SpendingBarChart({ data, currency }: SpendingBarChartProps) {
  const { colors } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleBarPress = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    return data.map((point, index) => ({
      value: point.amount,
      label: point.month,
      frontColor: selectedIndex === index ? colors.tint : colors.primary,
      onPress: () => handleBarPress(index),
    }));
  }, [data, colors, selectedIndex, handleBarPress]);

  const maxValue = useMemo(() => {
    if (data.length === 0) return 100;
    const max = Math.max(...data.map((d) => d.amount));
    return max > 0 ? max * 1.2 : 100; // Add 20% headroom
  }, [data]);

  const selectedData = selectedIndex !== null ? data[selectedIndex] : null;

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

      {/* Selected value display or hint */}
      <View style={styles.selectedValueContainer}>
        {selectedData ? (
          <Text style={[styles.selectedValue, { color: colors.text }]}>
            {selectedData.month}: {formatMoney(selectedData.amount, currency)}
          </Text>
        ) : (
          <Text style={[styles.hintText, { color: colors.secondaryText }]}>
            Tap a bar to see its value
          </Text>
        )}
      </View>

      <View style={styles.chartWrapper}>
        <BarChart
          data={chartData}
          barWidth={Math.min(
            32,
            Math.max(16, (SCREEN_WIDTH - CHART_PADDING - Y_AXIS_WIDTH) / data.length - BAR_SPACING)
          )}
          spacing={8}
          initialSpacing={10}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={1}
          xAxisColor={colors.border}
          yAxisThickness={0}
          yAxisTextStyle={{ color: colors.secondaryText, fontSize: 10 }}
          noOfSections={4}
          maxValue={maxValue}
          isAnimated={false}
          barBorderRadius={4}
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
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  selectedValueContainer: {
    minHeight: 24,
    justifyContent: 'center',
  },
  selectedValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  hintText: {
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  chartWrapper: {
    marginLeft: -SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    paddingVertical: SPACING.xxl,
  },
});
