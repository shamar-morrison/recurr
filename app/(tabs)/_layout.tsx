import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WarningDot } from '@/src/components/ui/WarningDot';
import { FONT_FAMILY } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useNotificationStatus } from '@/src/features/notifications/useNotificationStatus';
import { CreditCardIcon, ChartBarLineIcon, Settings01Icon } from '@hugeicons/core-free-icons';

import { AppIcon } from '@/src/components/ui/AppIcon';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const notificationsEnabled = useNotificationStatus();
  const showNotificationWarning = notificationsEnabled === false;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.45)',
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70 + insets.bottom,
          paddingTop: 5,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: FONT_FAMILY.semiBold,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Subscriptions',
          tabBarIcon: ({ color, size }) => (
            <AppIcon icon={CreditCardIcon} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <AppIcon icon={ChartBarLineIcon} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconWrapper}>
              <AppIcon icon={Settings01Icon} color={color} size={size} />
              {showNotificationWarning && (
                <View style={styles.warningDot}>
                  <WarningDot size={14} testID="settingsTabWarning" />
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'relative',
  },
  warningDot: {
    position: 'absolute',
    top: -2,
    right: -8,
  },
});
