import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { WarningDot } from '@/src/components/ui/WarningDot';
import { useTheme } from '@/src/context/ThemeContext';
import { useNotificationStatus } from '@/src/features/notifications/useNotificationStatus';
import { ChartBarIcon, CreditCardIcon, GearSixIcon } from 'phosphor-react-native';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
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
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Subscriptions',
          tabBarIcon: ({ color, size, focused }) => (
            <CreditCardIcon color={color} size={size} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size, focused }) => (
            <ChartBarIcon color={color} size={size} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconWrapper}>
              <GearSixIcon color={color} size={size} weight={focused ? 'fill' : 'regular'} />
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
