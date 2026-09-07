import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { cancelAllNotifications } from '@/src/features/notifications/notificationService';

// Per-user cache keys (see subscriptionsRepo, categoriesRepo, customServicesRepo).
const PER_USER_KEY_PREFIXES = [
  'subscriptions:v1:',
  'categories:v1:',
  'customServices:v1:',
] as const;

// Device-local IAP retry queue (see iapService saveFailedPurchase).
// These belong to purchases made on this device; drop them with the account.
const FAILED_IAP_KEY_PREFIX = '@iap_failed_ack_';

/**
 * Best-effort local wipe after remote account deletion.
 * Mirrors ShowSeek's clearLocalAccountData: never throws, warns on failure.
 *
 * Deliberately kept: onboarding flag (global), theme preference (device-level),
 * remote-config cache (global, refetched anyway).
 */
export async function clearLocalAccountData(userId?: string): Promise<void> {
  const keysToRemove = new Set<string>();

  if (userId) {
    for (const prefix of PER_USER_KEY_PREFIXES) {
      keysToRemove.add(`${prefix}${userId}`);
    }
  }

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    for (const key of allKeys) {
      if (key.startsWith(FAILED_IAP_KEY_PREFIX)) {
        keysToRemove.add(key);
      }
      // Safety net: catch any other per-user prefixed key for this uid.
      if (userId) {
        for (const prefix of PER_USER_KEY_PREFIXES) {
          if (key === `${prefix}${userId}`) {
            keysToRemove.add(key);
          }
        }
      }
    }
  } catch (error) {
    console.warn('[accountDeletion] Failed to enumerate AsyncStorage keys:', error);
  }

  if (keysToRemove.size > 0) {
    try {
      await AsyncStorage.multiRemove([...keysToRemove]);
    } catch (error) {
      console.warn('[accountDeletion] Failed to remove AsyncStorage keys:', error);
    }
  }

  await Promise.allSettled([
    cancelAllNotifications(),
    Notifications.dismissAllNotificationsAsync(),
  ]);
}
