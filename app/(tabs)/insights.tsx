import { Stack } from 'expo-router';
import { Crown, TrendingUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  useSubscriptionListItems,
  useSubscriptionsQuery,
} from '@/src/features/subscriptions/subscriptionsHooks';
import { SubscriptionCategory } from '@/src/features/subscriptions/types';
import { useAppTheme } from '@/src/theme/useAppTheme';

export default function InsightsScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isPremium } = useAuth();

  const subscriptionsQuery = useSubscriptionsQuery();
  const items = useSubscriptionListItems(subscriptionsQuery.data);

  const insights = useMemo(() => {
    const monthlyTotal = sum(items.map((i) => i.monthlyEquivalent));
    const yearlyTotal = monthlyTotal * 12;

    const byCategory = groupByCategory(items);
    const categoryRows = Object.entries(byCategory)
      .map(([category, list]) => {
        const total = sum(list.map((i) => i.monthlyEquivalent));
        return {
          category: category as SubscriptionCategory,
          monthlyTotal: total,
        };
      })
      .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

    const mostExpensive = items
      .slice()
      .sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent)[0];

    const upcoming = items
      .slice()
      .filter((i) => i.nextBillingInDays >= 0)
      .sort((a, b) => a.nextBillingInDays - b.nextBillingInDays)[0];

    const next7Days = items
      .filter((i) => i.nextBillingInDays >= 0 && i.nextBillingInDays <= 7)
      .sort((a, b) => a.nextBillingInDays - b.nextBillingInDays);

    return {
      monthlyTotal,
      yearlyTotal,
      categoryRows,
      mostExpensive,
      upcoming,
      next7Days,
    };
  }, [items]);

  return (
    <View style={styles.container} testID="insightsScreen">
      <ScrollView contentContainerStyle={styles.content} testID="insightsScroll">
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Spending</Text>
              {isPremium ? (
                <View style={styles.premiumPill} testID="insightsPremiumPill">
                  <Crown color="#fff" size={14} />
                  <Text style={styles.premiumPillText}>Premium</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroSubtitle}>Know your baseline before the bills hit.</Text>
          </View>

          {subscriptionsQuery.isLoading ? (
            <View style={styles.loadingRow} testID="insightsLoading">
              <ActivityIndicator color={theme.colors.tint} />
              <Text style={styles.loadingText}>Calculating…</Text>
            </View>
          ) : (
            <View style={styles.totals}>
              <View style={styles.totalCard} testID="insightsMonthlyTotal">
                <Text style={styles.totalLabel}>Monthly</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(insights.monthlyTotal, items[0]?.currency ?? 'USD')}
                </Text>
              </View>
              <View style={styles.totalCard} testID="insightsYearlyTotal">
                <Text style={styles.totalLabel}>Yearly</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(insights.yearlyTotal, items[0]?.currency ?? 'USD')}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <TrendingUp color={theme.colors.text} size={18} />
              <Text style={styles.cardTitle}>Highlights</Text>
            </View>
          </View>

          {items.length === 0 ? (
            <Text style={styles.subtitle} testID="insightsEmpty">
              Add a few subscriptions to see totals, breakdowns, and upcoming charges.
            </Text>
          ) : (
            <View style={styles.highlights}>
              <View style={styles.highlightRow} testID="insightsMostExpensive">
                <Text style={styles.highlightLabel}>Most expensive</Text>
                <Text style={styles.highlightValue} numberOfLines={1}>
                  {insights.mostExpensive?.serviceName ?? '—'} ·{' '}
                  {formatMoney(
                    insights.mostExpensive?.monthlyEquivalent ?? 0,
                    insights.mostExpensive?.currency ?? 'USD'
                  )}
                  /mo
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.highlightRow} testID="insightsUpcoming">
                <Text style={styles.highlightLabel}>Upcoming charge</Text>
                <Text style={styles.highlightValue} numberOfLines={1}>
                  {insights.upcoming?.serviceName ?? '—'}
                  {insights.upcoming
                    ? ` · ${formatShortDate(insights.upcoming.nextBillingDateISO)} (${Math.max(
                        0,
                        insights.upcoming.nextBillingInDays
                      )}d)`
                    : ''}
                </Text>
              </View>

              {insights.next7Days.length ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.highlightRow} testID="insightsNext7Days">
                    <Text style={styles.highlightLabel}>Next 7 days</Text>
                    <Text style={styles.highlightValue}>
                      {insights.next7Days.length} charge
                      {insights.next7Days.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>By category</Text>
          {items.length === 0 ? (
            <Text style={styles.subtitle}>—</Text>
          ) : (
            <View style={styles.bars} testID="insightsCategoryBreakdown">
              {insights.categoryRows.map((row) => {
                const pct =
                  insights.monthlyTotal <= 0 ? 0 : row.monthlyTotal / insights.monthlyTotal;
                return (
                  <View
                    key={row.category}
                    style={styles.barRow}
                    testID={`insightsCategory_${row.category}`}
                  >
                    <View style={styles.barTop}>
                      <Text style={styles.barLabel}>{row.category}</Text>
                      <Text style={styles.barValue}>
                        {formatMoney(row.monthlyTotal, items[0]?.currency ?? 'USD')}
                      </Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          {
                            width: `${Math.max(0, Math.min(1, pct)) * 100}%`,
                            backgroundColor: theme.colors.tint,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {!isPremium ? (
          <View style={styles.locked} testID="insightsLocked">
            <Text style={styles.lockedTitle}>Premium unlocks deeper insights</Text>
            <Text style={styles.lockedText}>
              Next: trends over time, spend alerts, and smarter reminders.
            </Text>
          </View>
        ) : null}

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

function groupByCategory(items: ReturnType<typeof useSubscriptionListItems>) {
  const map: Record<SubscriptionCategory, typeof items> = {
    Streaming: [],
    Music: [],
    Software: [],
    Utilities: [],
    Other: [],
  };

  for (const item of items) {
    const cat = item.category;
    const list = map[cat] ?? map.Other;
    list.push(item);
  }

  return map;
}

function sum(nums: number[]): number {
  let t = 0;
  for (const n of nums) t += Number.isFinite(n) ? n : 0;
  return t;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch (e) {
    console.log('[insights] formatMoney failed', e);
    const safe = Number.isFinite(amount) ? amount : 0;
    return `${safe.toFixed(2)} ${currency || 'USD'}`;
  }
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    console.log('[insights] formatShortDate failed', e);
    return '—';
  }
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  const shadowColor = theme.isDark ? 'rgba(0,0,0,0.65)' : 'rgba(15,23,42,0.12)';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 28,
      gap: 16,
    },
    hero: {
      borderRadius: 32,
      padding: 24,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
      gap: 16,
    },
    heroTop: {
      gap: 8,
    },
    heroTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    heroTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: -0.1,
      opacity: 0.9,
    },
    heroSubtitle: {
      color: '#fff',
      fontSize: 14,
      lineHeight: 20,
      opacity: 0.8,
      maxWidth: 320,
    },
    premiumPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    premiumPillText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 0.4,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    loadingText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    totals: {
      flexDirection: 'row',
      gap: 12,
    },
    totalCard: {
      flex: 1,
      borderRadius: 20,
      padding: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      gap: 4,
    },
    totalLabel: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      opacity: 0.8,
    },
    totalValue: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    card: {
      borderRadius: 26,
      padding: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: 'transparent', // theme.colors.border, clean look
      shadowColor,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      gap: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    subtitle: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      lineHeight: 20,
    },
    highlights: {
      gap: 12,
    },
    highlightRow: {
      gap: 4,
    },
    highlightLabel: {
      color: theme.colors.secondaryText,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    highlightValue: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      opacity: 0.5,
    },
    bars: {
      gap: 16,
    },
    barRow: {
      gap: 8,
    },
    barTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    barLabel: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    barValue: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    track: {
      height: 12,
      borderRadius: 999,
      backgroundColor: theme.isDark ? '#222' : '#F2F4F7',
      overflow: 'hidden',
    },
    fill: {
      height: 12,
      borderRadius: 999,
    },
    locked: {
      borderRadius: 26,
      padding: 20,
      backgroundColor: theme.isDark ? 'rgba(121,167,255,0.08)' : 'rgba(79,140,255,0.06)',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(121,167,255,0.20)' : 'rgba(79,140,255,0.15)',
      gap: 8,
    },
    lockedTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    lockedText: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      lineHeight: 20,
    },
    footerSpace: {
      height: 20,
    },
  });
}
