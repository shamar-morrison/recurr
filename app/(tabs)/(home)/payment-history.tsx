import { router, Stack, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon, CheckCircleIcon, ClockIcon } from 'phosphor-react-native';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ServiceLogo } from '@/src/components/ServiceLogo';
import { Button } from '@/src/components/ui/Button';
import { formatDate as formatDateUtil } from '@/src/constants/dateFormats';
import { getServiceDomain } from '@/src/constants/services';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useSubscriptionQuery } from '@/src/features/subscriptions/subscriptionsHooks';
import {
  generatePaymentHistory,
  PaymentHistoryEntry,
} from '@/src/features/subscriptions/subscriptionsUtils';
import { formatMoney } from '@/src/utils/formatMoney';

const Separator = () => <View style={styles.separator} />;

type RouteParams = {
  id: string;
};

export default function PaymentHistoryScreen() {
  const params = useLocalSearchParams<RouteParams>();
  const subscriptionId = params.id;

  const { settings } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: subscription, isLoading, isError } = useSubscriptionQuery(subscriptionId);

  const formatDate = useCallback(
    (date: Date) => formatDateUtil(date, settings.dateFormat),
    [settings.dateFormat]
  );

  // Generate payment history
  const payments = useMemo(() => {
    if (!subscription) return [];
    return generatePaymentHistory(subscription, {
      futureCount: 12,
      maxPastCount: 100,
    });
  }, [subscription]);

  // Separate past and future payments for section headers
  const { pastPayments, futurePayments } = useMemo(() => {
    const past = payments.filter((p) => p.isPast).reverse(); // Most recent first
    const future = payments.filter((p) => !p.isPast);
    return { pastPayments: past, futurePayments: future };
  }, [payments]);

  const headerLeft = useCallback(
    () => (
      <Pressable
        onPress={() => router.back()}
        style={[styles.headerButton, { backgroundColor: colors.tertiaryBackground }]}
        testID="paymentHistoryBack"
      >
        <CaretLeftIcon color={colors.text} size={22} />
      </Pressable>
    ),
    [colors]
  );

  const renderPaymentItem = useCallback(
    ({ item }: { item: PaymentHistoryEntry }) => {
      const isPast = item.isPast;

      return (
        <View
          style={[styles.paymentRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.paymentLeft}>
            {isPast ? (
              <CheckCircleIcon color={colors.positive} size={24} weight="fill" />
            ) : (
              <ClockIcon color={colors.warning} size={24} />
            )}
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentDate, { color: colors.text }]}>
                {formatDate(item.date)}
              </Text>
              <Text style={[styles.paymentStatus, { color: colors.secondaryText }]}>
                {isPast ? 'Paid' : 'Upcoming'}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.paymentAmount, { color: isPast ? colors.text : colors.secondaryText }]}
          >
            {formatMoney(item.amount, item.currency)}
          </Text>
        </View>
      );
    },
    [colors, formatDate]
  );

  const keyExtractor = useCallback(
    (item: PaymentHistoryEntry, index: number) => `${item.date.getTime()}-${index}`,
    []
  );

  const ListHeader = useMemo(() => {
    if (!subscription) return null;

    return (
      <View style={styles.header}>
        <View style={styles.heroCompact}>
          <ServiceLogo
            serviceName={subscription.serviceName}
            domain={getServiceDomain(subscription.serviceName)}
            size={48}
            borderRadius={12}
          />
          <View style={styles.heroText}>
            <Text style={[styles.serviceName, { color: colors.text }]}>
              {subscription.serviceName}
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Payment History</Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View
          style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{pastPayments.length}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Paid</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{futurePayments.length}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Upcoming</Text>
          </View>
        </View>

        {/* Section Header for list */}
        {payments.length > 0 && (
          <Text style={[styles.sectionHeader, { color: colors.secondaryText }]}>All Payments</Text>
        )}
      </View>
    );
  }, [subscription, colors, pastPayments.length, futurePayments.length, payments.length]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Payment History', headerLeft }} />
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.tint} size="large" />
        </View>
      </>
    );
  }

  // Error or not found state
  if (isError || !subscription) {
    return (
      <>
        <Stack.Screen options={{ title: 'Payment History', headerLeft }} />
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.text }]}>Subscription not found</Text>
          <Button title="Go Back" onPress={() => router.back()} size="sm" />
        </View>
      </>
    );
  }

  const combinedPayments = useMemo(
    () => [...pastPayments, ...futurePayments],
    [pastPayments, futurePayments]
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Payment History', headerLeft }} />

      <FlatList
        data={combinedPayments}
        renderItem={renderPaymentItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        style={[styles.container, { backgroundColor: colors.background }]}
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        testID="paymentHistoryList"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  header: {
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  heroCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroText: {
    flex: 1,
  },
  serviceName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    marginHorizontal: SPACING.lg,
  },
  sectionHeader: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  paymentInfo: {
    gap: 2,
  },
  paymentDate: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  paymentStatus: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  separator: {
    height: SPACING.sm,
  },
});
