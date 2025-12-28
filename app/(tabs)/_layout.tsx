import { Tabs } from 'expo-router';
import React from 'react';

import { useAppTheme } from '@/src/theme/useAppTheme';
import { ChartBarIcon, CreditCardIcon, GearSixIcon } from 'phosphor-react-native';

export default function TabLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.tint,
        tabBarInactiveTintColor: theme.isDark ? 'rgba(236,242,255,0.50)' : 'rgba(15,23,42,0.45)',
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
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
            <GearSixIcon color={color} size={size} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tabs>
  );
}
