import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Alert, Linking, Platform } from 'react-native';

import { nextBillingDate } from '@/src/features/subscriptions/subscriptionsUtils';
import {
  getSubscription,
  upsertSubscription,
} from '@/src/features/subscriptions/subscriptionsRepo';
import { Subscription } from '@/src/features/subscriptions/types';

// Configure notification handling behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Category + action identifiers for billing reminder snooze buttons.
 * Registered via `setNotificationCategoryAsync` so scheduled reminders
 * show "Snooze 1 day" / "Snooze 3 days" actions on both platforms.
 */
export const BILLING_REMINDER_CATEGORY_ID = 'billing-reminder-actions';
export const SNOOZE_1_DAY_ACTION_ID = 'snooze-1-day';
export const SNOOZE_3_DAYS_ACTION_ID = 'snooze-3-days';

/** Snooze durations (in days) for the two notification action buttons. */
const SNOOZE_ACTION_DAYS: Record<string, number> = {
  [SNOOZE_1_DAY_ACTION_ID]: 1,
  [SNOOZE_3_DAYS_ACTION_ID]: 3,
};

/**
 * Register the billing-reminder notification category with snooze actions.
 * Safe to call multiple times; failures are logged, never thrown.
 */
export async function registerBillingReminderActions(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync(BILLING_REMINDER_CATEGORY_ID, [
      {
        identifier: SNOOZE_1_DAY_ACTION_ID,
        buttonTitle: 'Snooze 1 day',
        options: { opensAppToForeground: false },
      },
      {
        identifier: SNOOZE_3_DAYS_ACTION_ID,
        buttonTitle: 'Snooze 3 days',
        options: { opensAppToForeground: false },
      },
    ]);
  } catch (error) {
    console.error('[notifications] registerBillingReminderActions failed:', error);
  }
}

/**
 * Whether a subscription currently has an active (future) snooze.
 */
export function isSnoozedActive(
  subscription: Pick<Subscription, 'snoozedUntil'>,
  now: number = Date.now()
): boolean {
  return typeof subscription.snoozedUntil === 'number' && subscription.snoozedUntil > now;
}

/**
 * Open the app's page in system Settings so the user can (re-)enable
 * notifications. The OS permission is the single source of truth for
 * whether reminders can be delivered.
 */
export function openAppNotificationSettings(): void {
  try {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  } catch (error) {
    console.error('[notifications] openAppNotificationSettings failed:', error);
  }
}

/**
 * Request notification permissions from the user.
 * Mirrors ShowSeek's useNotificationPermissions request flow:
 * re-checks existing status, directs permanently-denied users to Settings,
 * and never throws — returns false on any failure.
 * @returns true if permissions were granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const {
      status: existingStatus,
      granted,
      canAskAgain,
    } = await Notifications.getPermissionsAsync();

    if (granted || existingStatus === 'granted') {
      return true;
    }

    // Permanently denied — the OS won't show a prompt, so offer Settings instead.
    // Caller decides whether/how to proceed; we don't block.
    if (canAskAgain === false) {
      Alert.alert(
        'Notifications are off',
        'To get payment reminders, please enable notifications in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openAppNotificationSettings },
        ]
      );
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[notifications] requestNotificationPermissions failed:', error);
    return false;
  }
}

/**
 * Check if notification permissions are currently granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[notifications] hasNotificationPermissions failed:', error);
    return false;
  }
}

/**
 * Calculate the reminder date based on the next billing date and reminder days
 * @param reminderHour Hour of day for the reminder (0-23), defaults to 12 (noon)
 */
function calculateReminderDate(
  subscription: Subscription,
  reminderDays: number,
  reminderHour: number = 12
): Date | null {
  const now = new Date();

  let billingDate: Date;
  let anchor: Date | undefined;

  if (subscription.billingCycle === 'One-Time') {
    // For one-time payments, use the startDate (payment date)
    if (!subscription.startDate) return null;
    billingDate = new Date(subscription.startDate);
  } else {
    // For recurring subscriptions, calculate next billing date
    anchor = subscription.startDate
      ? new Date(subscription.startDate)
      : new Date(subscription.createdAt);
    billingDate = nextBillingDate(now, subscription.billingCycle, anchor);
  }

  // Calculate reminder date (X days before billing)
  const reminderDate = new Date(billingDate);
  reminderDate.setDate(reminderDate.getDate() - reminderDays);

  reminderDate.setHours(reminderHour, 0, 0, 0);

  // Don't schedule if the reminder date is in the past
  if (reminderDate <= now) {
    // For recurring subscriptions, try next cycle
    if (subscription.billingCycle !== 'One-Time' && anchor) {
      // Look for the next billing date after the currently calculated one
      const nextCycleSearchDate = new Date(billingDate);
      nextCycleSearchDate.setDate(nextCycleSearchDate.getDate() + 1);

      const nextCycleBillingDate = nextBillingDate(
        nextCycleSearchDate,
        subscription.billingCycle,
        anchor
      );

      const nextReminderDate = new Date(nextCycleBillingDate);
      nextReminderDate.setDate(nextReminderDate.getDate() - reminderDays);
      nextReminderDate.setHours(reminderHour, 0, 0, 0);

      if (nextReminderDate > now) {
        return nextReminderDate;
      }
    }
    return null;
  }

  return reminderDate;
}

/**
 * Get the user's preferred locale for date formatting
 */
function getDeviceLocale(): string {
  const locales = Localization.getLocales();
  return locales[0]?.languageTag ?? 'en-US';
}

/**
 * Format a date for display in notifications
 */
function formatNotificationDate(date: Date): string {
  return date.toLocaleDateString(getDeviceLocale(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Schedule a reminder notification for a subscription
 * @param reminderHour Hour of day for the reminder (0-23), defaults to 12 (noon)
 * @returns The notification identifier, or null if scheduling failed
 */
export async function scheduleSubscriptionReminder(
  subscription: Subscription,
  reminderDays: number,
  reminderHour: number = 12
): Promise<string | null> {
  try {
    // Check permissions first
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      console.log('[notifications] No permission to schedule notification');
      return null;
    }

    // Calculate when to send the reminder
    const reminderDate = calculateReminderDate(subscription, reminderDays, reminderHour);
    if (!reminderDate) {
      console.log('[notifications] Reminder date is in the past, skipping');
      return null;
    }

    // Calculate the billing date for the notification message
    const now = new Date();
    let billingDate: Date;
    if (subscription.billingCycle === 'One-Time') {
      billingDate = subscription.startDate ? new Date(subscription.startDate) : now;
    } else {
      const anchor = subscription.startDate
        ? new Date(subscription.startDate)
        : new Date(subscription.createdAt);
      billingDate = nextBillingDate(now, subscription.billingCycle, anchor);
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📅 ${subscription.serviceName} Renewal Coming Up`,
        body: `Your ${subscription.serviceName} subscription renews in ${reminderDays} day${reminderDays > 1 ? 's' : ''} on ${formatNotificationDate(billingDate)}`,
        data: {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          type: 'billing_reminder',
        },
        sound: 'default',
        categoryIdentifier: BILLING_REMINDER_CATEGORY_ID,
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'billing-reminders',
          },
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    console.log('[notifications] Scheduled reminder:', {
      subscriptionId: subscription.id,
      notificationId,
      reminderDate: reminderDate.toISOString(),
    });

    return notificationId;
  } catch (error) {
    console.error('[notifications] scheduleSubscriptionReminder failed:', error);
    return null;
  }
}

export type SnoozeResult = {
  notificationId: string | null;
  snoozedUntil: number | null;
};

/**
 * In-flight snooze guard, keyed by subscriptionId.
 * Two concurrent snoozes for the same subscription (e.g. double-tapped tray
 * action) would each read-modify-write the same stale snapshot and leave an
 * orphaned duplicate notification; the second call is ignored instead.
 */
const snoozeInflight = new Map<string, Promise<unknown>>();

/**
 * Run `task` exclusively per subscriptionId. Returns the task result, or
 * null if another snooze for the same subscription is already in-flight
 * (caller should treat null as "already handled, do nothing").
 */
export async function withSnoozeLock<T>(
  subscriptionId: string,
  task: () => Promise<T>
): Promise<T | null> {
  if (snoozeInflight.has(subscriptionId)) {
    console.log('[notifications] Snooze already in-flight, ignoring duplicate:', subscriptionId);
    return null;
  }
  const p = task().finally(() => {
    snoozeInflight.delete(subscriptionId);
  });
  snoozeInflight.set(subscriptionId, p);
  return p;
}

/**
 * Schedule a one-off snoozed reminder for an exact timestamp.
 * Shared core for `snoozeSubscriptionReminder` (day counts) and custom dates.
 *
 * Cancels the currently scheduled notification for the subscription, then
 * schedules a new one-off notification at `snoozedUntil`, fired at the
 * subscription's `reminderHour` (default noon). Does NOT modify
 * `reminderDays` / `reminderHour` — those stay as the permanent setting.
 *
 * @returns The new notificationId and snoozedUntil timestamp (both null on failure)
 */
export async function snoozeSubscriptionReminderUntil(
  subscription: Subscription,
  snoozedUntil: Date | number
): Promise<SnoozeResult> {
  try {
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      console.log('[notifications] No permission to snooze notification');
      return { notificationId: null, snoozedUntil: null };
    }

    const snoozeDate = snoozedUntil instanceof Date ? snoozedUntil : new Date(snoozedUntil);
    if (Number.isNaN(snoozeDate.getTime()) || snoozeDate.getTime() <= Date.now()) {
      console.log('[notifications] Snooze date is in the past, skipping');
      return { notificationId: null, snoozedUntil: null };
    }

    // Cancel the currently scheduled notification for this subscription
    if (subscription.notificationId) {
      await cancelNotification(subscription.notificationId);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📅 ${subscription.serviceName} Renewal Reminder`,
        body: `Snoozed reminder for your ${subscription.serviceName} subscription`,
        data: {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          type: 'billing_reminder',
          snoozed: true,
          snoozedUntil: snoozeDate.getTime(),
        },
        sound: 'default',
        categoryIdentifier: BILLING_REMINDER_CATEGORY_ID,
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'billing-reminders',
          },
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: snoozeDate,
      },
    });

    console.log('[notifications] Snoozed reminder:', {
      subscriptionId: subscription.id,
      notificationId,
      snoozedUntil: snoozeDate.toISOString(),
    });

    return { notificationId, snoozedUntil: snoozeDate.getTime() };
  } catch (error) {
    console.error('[notifications] snoozeSubscriptionReminderUntil failed:', error);
    return { notificationId: null, snoozedUntil: null };
  }
}

/**
 * Snooze a subscription's reminder by a number of days.
 * Fires at (now + snoozeDays) at the subscription's reminderHour
 * (default noon if reminderHour is null).
 *
 * Does NOT modify reminderDays/reminderHour (those stay as the permanent
 * setting). Persist the returned `notificationId` + `snoozedUntil` on the
 * subscription (e.g. via `subscriptionsRepo.upsertSubscription`).
 *
 * @returns The new notificationId and snoozedUntil timestamp (both null on failure)
 */
export async function snoozeSubscriptionReminder(
  subscription: Subscription,
  snoozeDays: number
): Promise<SnoozeResult> {
  const safeDays = Number.isFinite(snoozeDays) && snoozeDays > 0 ? snoozeDays : 1;
  const hour = subscription.reminderHour ?? 12;
  const snoozeDate = new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
  snoozeDate.setHours(hour, 0, 0, 0);
  // Whole-day snoozes landing exactly on the hour boundary could fall into
  // the past due to ms drift — push forward a minute to stay in the future.
  if (snoozeDate.getTime() <= Date.now()) {
    snoozeDate.setTime(Date.now() + 60_000);
  }
  return snoozeSubscriptionReminderUntil(subscription, snoozeDate);
}

/**
 * Cancel a scheduled notification by its ID
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[notifications] Cancelled notification:', notificationId);
  } catch (error) {
    console.error('[notifications] cancelNotification failed:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[notifications] Cancelled all notifications');
  } catch (error) {
    console.error('[notifications] cancelAllNotifications failed:', error);
  }
}

/**
 * Get all currently scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[notifications] getScheduledNotifications failed:', error);
    return [];
  }
}

/**
 * Set up the notification response handler
 * This should be called once on app mount
 */
export function setupNotificationHandler(): () => void {
  // Ensure the snooze action buttons exist before any reminder fires
  void registerBillingReminderActions();

  // Handle notification taps when app is in foreground or background
  const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data as {
      subscriptionId?: unknown;
      userId?: unknown;
      type?: unknown;
    };
    console.log('[notifications] Notification tapped:', data);

    // Only handle our own notifications
    if (data?.type !== 'billing_reminder') {
      return;
    }

    // Snooze action buttons — reschedule + persist without navigating.
    // Guarded: a rapid double-tap must not schedule twice (see withSnoozeLock).
    const snoozeDays = SNOOZE_ACTION_DAYS[response.actionIdentifier];
    if (
      snoozeDays !== undefined &&
      typeof data.subscriptionId === 'string' &&
      typeof data.userId === 'string'
    ) {
      const subscriptionId = data.subscriptionId;
      const userId = data.userId;
      try {
        await withSnoozeLock(subscriptionId, async () => {
          const sub = await getSubscription(userId, subscriptionId);
          if (!sub) {
            console.log('[notifications] Snooze target subscription not found');
            return;
          }
          const result = await snoozeSubscriptionReminder(sub, snoozeDays);
          if (result.notificationId && result.snoozedUntil) {
            const saved = await upsertSubscription(userId, {
              ...sub,
              notificationId: result.notificationId,
              snoozedUntil: result.snoozedUntil,
            });
            if (saved.pendingSync === true) {
              console.log(
                '[notifications] Snooze saved locally; Firestore sync pending for:',
                subscriptionId
              );
            }
          }
        });
      } catch (error) {
        console.error('[notifications] Failed to snooze from notification action:', error);
      }
      return;
    }

    // Body tap (default action) — keep existing behavior
    router.navigate('/(tabs)/(home)/subscriptions');
  });

  // Configure Android channel if needed - required for Android 13+ permission prompt
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('billing-reminders', {
      name: 'Billing Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F8CFF',
      sound: 'default',
    }).catch((error) => {
      console.error('[notifications] Failed to create billing-reminders channel:', error);
    });
  }

  return () => {
    subscription.remove();
  };
}

/**
 * Reschedule all reminders for active subscriptions
 * Call this when app opens to ensure reminders are up to date
 */
export async function rescheduleAllReminders(
  subscriptions: Subscription[],
  pushNotificationsEnabled: boolean
): Promise<Map<string, string>> {
  const notificationMap = new Map<string, string>();

  // If push notifications are disabled, cancel all and return empty map
  if (!pushNotificationsEnabled) {
    await cancelAllNotifications();
    return notificationMap;
  }

  // Cancel all existing notifications first
  await cancelAllNotifications();

  // Schedule new reminders for subscriptions that have them configured
  const now = Date.now();
  for (const sub of subscriptions) {
    // Skip archived subscriptions and those with past end dates
    const hasEnded = sub.endDate && sub.endDate < now;
    if (sub.reminderDays && sub.reminderDays > 0 && sub.status === 'Active' && !hasEnded) {
      const notificationId = await scheduleSubscriptionReminder(
        sub,
        sub.reminderDays,
        sub.reminderHour ?? 12
      );
      if (notificationId) {
        notificationMap.set(sub.id, notificationId);
      }
    }
  }

  console.log('[notifications] Rescheduled reminders:', notificationMap.size);
  return notificationMap;
}
