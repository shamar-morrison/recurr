import { Stack } from 'expo-router';
import React from 'react';

import { useAppTheme } from '@/src/theme/useAppTheme';

export default function HomeStackLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      initialRouteName="subscriptions"
      screenOptions={{
        headerTitle: 'Subscriptions',
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    />
  );
}
