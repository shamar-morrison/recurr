import { router, Stack } from 'expo-router';
import { CaretLeftIcon, WarningCircleIcon } from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryBreakdownChart } from '@/src/components/charts/CategoryBreakdownChart';
import { SpendingBarChart } from '@/src/components/charts/SpendingBarChart';
import { SpendingTrendChart } from '@/src/components/charts/SpendingTrendChart';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useCategories } from '@/src/features/subscriptions/hooks';
import { useSubscriptionsQuery } from '@/src/features/subscriptions/subscriptionsHooks';
import { formatMoney } from '@/src/utils/formatMoney';
import {
  calculateSpendingByCategory,
  calculateSpendingByMonth,
  DateRangeType,
  detectMixedCurrencies,
  getDateRange,
} from '@/src/utils/spendingCalculations';

const DATE_RANGE_OPTIONS: { value: DateRangeType; label: string }[] = [
  { value: '6months', label: '6 Mo' },
  { value: 'ytd', label: 'YTD' },
  { value: 'year', label: 'Year' },
  { value: 'alltime', label: 'All' },
];

// Extracted outside component to avoid recreating on every render
const HeaderBackButton = React.memo(function HeaderBackButton({
  backgroundColor,
  iconColor,
}: {
  backgroundColor: string;
  iconColor: string;
}) {
  return (
    <Pressable
      onPress={() => router.back()}
      style={[styles.headerButton, { backgroundColor }]}
      testID="spendingHistoryBack"
    >
      <CaretLeftIcon color={iconColor} size={22} />
    </Pressable>
  );
});

export default function SpendingHistoryScreen() {
  const { colors } = useTheme();
  const { customCategories } = useCategories();

  const [selectedRange, setSelectedRange] = useState<DateRangeType>('6months');
  const [includePaused, setIncludePaused] = useState(false);

  const { data: subscriptions, isLoading } = useSubscriptionsQuery();

  const dateRange = useMemo(() => getDateRange(selectedRange), [selectedRange]);

  const currencyInfo = useMemo(() => {
    if (!subscriptions)
      return { hasMixedCurrencies: false, currencies: [], primaryCurrency: 'USD' };
    return detectMixedCurrencies(subscriptions);
  }, [subscriptions]);

  const monthlyData = useMemo(() => {
    if (!subscriptions) return [];
    return calculateSpendingByMonth(subscriptions, dateRange.startDate, dateRange.endDate, {
      includePaused,
    });
  }, [subscriptions, dateRange, includePaused]);

  const categoryData = useMemo(() => {
    if (!subscriptions) return [];
    return calculateSpendingByCategory(subscriptions, dateRange.startDate, dateRange.endDate, {
      includePaused,
      customCategories,
    });
  }, [subscriptions, dateRange, includePaused, customCategories]);

  const totalSpending = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return 0;
    return monthlyData.reduce((sum, month) => sum + month.amount, 0);
  }, [monthlyData]);

  const headerLeft = useMemo(
    () => () => (
      <HeaderBackButton backgroundColor={colors.tertiaryBackground} iconColor={colors.text} />
    ),
    [colors.tertiaryBackground, colors.text]
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Spending History', headerLeft }} />
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.tint} size="large" />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
            Calculating spending...
          </Text>
        </View>
      </>
    );
  }

  const hasData = subscriptions && subscriptions.length > 0;

  return (
    <>
      <Stack.Screen options={{ title: 'Spending History', headerLeft }} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          testID="spendingHistoryScroll"
        >
          {/* Total Spending Hero */}
          <View
            style={[styles.hero, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          >
            <Text style={styles.heroLabel}>Total Spending</Text>
            <Text style={styles.heroValue}>
              {formatMoney(totalSpending, currencyInfo.primaryCurrency)}
            </Text>
            <Text style={styles.heroPeriod}>{dateRange.label}</Text>
          </View>

          {/* Mixed Currency Warning */}
          {currencyInfo.hasMixedCurrencies && (
            <View style={[styles.warningBanner, { backgroundColor: colors.negativeBackground }]}>
              <WarningCircleIcon color={colors.warning} size={20} />
              <Text style={[styles.warningText, { color: colors.text }]}>
                You have subscriptions in multiple currencies ({currencyInfo.currencies.join(', ')}
                ). Totals are shown in {currencyInfo.primaryCurrency} without conversion.
              </Text>
            </View>
          )}

          {/* Date Range Selector */}
          <View style={[styles.rangeSelector, { backgroundColor: colors.card }]}>
            {DATE_RANGE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setSelectedRange(option.value)}
                style={[
                  styles.rangeOption,
                  selectedRange === option.value && {
                    backgroundColor: colors.primary,
                  },
                ]}
                testID={`range_${option.value}`}
              >
                <Text
                  style={[
                    styles.rangeOptionText,
                    {
                      color: selectedRange === option.value ? '#fff' : colors.secondaryText,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Include Paused Toggle */}
          <View style={[styles.toggleRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Include paused subscriptions
            </Text>
            <Switch
              value={includePaused}
              onValueChange={setIncludePaused}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
              testID="includePausedToggle"
            />
          </View>

          {!hasData ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Subscriptions</Text>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                Add subscriptions to see your spending history and trends.
              </Text>
            </View>
          ) : (
            <>
              {/* Spending Trend Chart */}
              <SpendingTrendChart data={monthlyData} currency={currencyInfo.primaryCurrency} />

              {/* Monthly Bar Chart */}
              <SpendingBarChart data={monthlyData} currency={currencyInfo.primaryCurrency} />

              {/* Category Breakdown */}
              <CategoryBreakdownChart data={categoryData} currency={currencyInfo.primaryCurrency} />
            </>
          )}

          <View style={styles.footerSpace} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  hero: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.xs,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroPeriod: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    lineHeight: 20,
  },
  rangeSelector: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xs,
  },
  rangeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  rangeOptionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerSpace: {
    height: SPACING.xl,
  },
});
