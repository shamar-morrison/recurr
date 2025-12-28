import { Tabs } from 'expo-router';
import React from 'react';

import { AppColors } from '@/constants/colors';
import { ChartBarIcon, CreditCardIcon, GearSixIcon } from 'phosphor-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: AppColors.tint,
        tabBarInactiveTintColor: 'rgba(15,23,42,0.45)',
        tabBarStyle: {
          backgroundColor: AppColors.card,
          borderTopColor: AppColors.border,
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
