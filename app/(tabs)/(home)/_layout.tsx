import { Stack } from 'expo-router';
import React from 'react';

export default function HomeStackLayout() {
  return (
    <Stack
      initialRouteName="subscriptions"
      screenOptions={{
        headerTitle: 'Subscriptions',
        headerBackTitle: 'Back',
      }}
    />
  );
}
