import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { nextBillingDate } from '@/src/features/subscriptions/subscriptionsUtils';
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
 * Request notification permissions from the user
 * @returns true if permissions were granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
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
  if (subscription.billingCycle === 'One-Time') {
    // For one-time payments, use the startDate (payment date)
    if (!subscription.startDate) return null;
    billingDate = new Date(subscription.startDate);
  } else {
    // For recurring subscriptions, calculate next billing date
    const anchor = subscription.startDate
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
    // For recurring subscriptions, try next month
    if (subscription.billingCycle !== 'One-Time') {
      const nextMonth = new Date(billingDate);
      nextMonth.setMonth(nextMonth.getMonth() + (subscription.billingCycle === 'Yearly' ? 12 : 1));
      const nextReminderDate = new Date(nextMonth);
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
          type: 'billing_reminder',
        },
        sound: 'default',
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
  // Handle notification taps when app is in foreground or background
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log('[notifications] Notification tapped:', data);

    // Only handle our own notifications
    if (data?.type === 'billing_reminder') {
      // Navigate to home screen
      router.navigate('/(tabs)/(home)/subscriptions');
    }
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
    if (sub.reminderDays && sub.reminderDays > 0 && !sub.isArchived && !hasEnded) {
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
