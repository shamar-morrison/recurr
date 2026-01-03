import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getCategoryColors } from '@/constants/colors';
import { CategoryBadge } from '@/src/components/ui/CategoryBadge';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { formatMoney } from '@/src/utils/formatMoney';
import { CategorySpending } from '@/src/utils/spendingCalculations';

interface CategoryBreakdownChartProps {
  data: CategorySpending[];
  currency: string;
  maxCategories?: number;
}

export function CategoryBreakdownChart({
  data,
  currency,
  maxCategories = 8,
}: CategoryBreakdownChartProps) {
  const { colors } = useTheme();

  const displayData = useMemo(() => {
    return data.slice(0, maxCategories);
  }, [data, maxCategories]);

  const maxValue = useMemo(() => {
    if (displayData.length === 0) return 100;
    const max = Math.max(...displayData.map((d) => d.amount));
    return max > 0 ? max * 1.1 : 100;
  }, [displayData]);

  if (displayData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>By Category</Text>
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
          No category data available
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>By Category</Text>
      <View style={styles.categoryList}>
        {displayData.map((item) => {
          const categoryColors = getCategoryColors(item.category, item.customColor);
          const widthPercent = maxValue > 0 ? (item.amount / maxValue) * 100 : 0;

          return (
            <View key={item.category} style={styles.categoryRow}>
              <View style={styles.categoryHeader}>
                <CategoryBadge category={item.category} customColor={item.customColor} size="sm" />
                <Text style={[styles.categoryAmount, { color: colors.text }]}>
                  {formatMoney(item.amount, currency)}
                </Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.cardAlt }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(2, Math.min(100, widthPercent))}%`,
                      backgroundColor: categoryColors.text,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
      {data.length > maxCategories && (
        <Text style={[styles.moreText, { color: colors.secondaryText }]}>
          +{data.length - maxCategories} more categories
        </Text>
      )}
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
  categoryList: {
    gap: SPACING.lg,
  },
  categoryRow: {
    gap: SPACING.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  barTrack: {
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    paddingVertical: SPACING.xxl,
  },
  moreText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
});
