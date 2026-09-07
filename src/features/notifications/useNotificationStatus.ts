import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { hasNotificationPermissions } from '@/src/features/notifications/notificationService';

/**
 * Live OS notification permission status.
 * The OS permission is the single source of truth for whether billing
 * reminders can be delivered.
 *
 * @returns true if granted, false if denied, null while still checking
 * (callers should treat null as "don't show any warning yet").
 */
export function useNotificationStatus(): boolean | null {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      setNotificationsEnabled(await hasNotificationPermissions());
    } catch (e) {
      console.log('[notifications] failed to check permission status', e);
    }
  }, []);

  // Re-check whenever the hosting screen gains focus and when the app returns
  // from the background (e.g. the user enabled notifications in system
  // Settings), so warnings clear without needing a reload.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  return notificationsEnabled;
}
