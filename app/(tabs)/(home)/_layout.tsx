import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/src/theme/useAppTheme';

export default function HomeStackLayout() {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
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
        }}
      />
    </SafeAreaView>
  );
}
