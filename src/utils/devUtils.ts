import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

import {
  hasNotificationPermissions,
  requestNotificationPermissions,
} from '@/src/features/notifications/notificationService';

/**
 * schedules a test notification for 5 seconds from now.
 * This is intended for development purposes only.
 */
export async function scheduleTestNotification() {
  const hasPermission = await hasNotificationPermissions();
  if (!hasPermission) {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert('Permission Denied', 'Please enable notifications to test reminders.');
      return;
    }
  }

  Alert.alert('Test Reminder', 'Scheduling a test notification for 5 seconds from now...', [
    { text: 'OK' },
  ]);

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Test Subscription Renewal',
        body: 'Your Test Service subscription renews in 2 days on Jan 1st.',
        sound: 'default',
        data: { type: 'test_reminder' },
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'billing-reminders',
          },
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });
  } catch (error) {
    console.error('Failed to schedule test notification:', error);
    Alert.alert('Error', 'Failed to schedule test notification');
  }
}
