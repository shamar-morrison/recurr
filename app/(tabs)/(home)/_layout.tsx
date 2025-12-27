import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Stack } from 'expo-router';
import React from 'react';

import { StackHeader } from '@/src/components/ui/StackHeader';
import { useAppTheme } from '@/src/theme/useAppTheme';

function HomeHeader({ options }: NativeStackHeaderProps) {
  return (
    <StackHeader
      title="My Subscriptions"
      subtitle="Manage your recurring payments"
      headerRight={options.headerRight?.({ canGoBack: false })}
    />
  );
}

function EditorHeader({ options, navigation }: NativeStackHeaderProps) {
  const title = typeof options.title === 'string' ? options.title : 'Subscription';

  return (
    <StackHeader
      title={title}
      showBack={navigation.canGoBack()}
      headerLeft={options.headerLeft?.({ canGoBack: navigation.canGoBack() })}
    />
  );
}

export default function HomeStackLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      initialRouteName="subscriptions"
      screenOptions={{
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="subscriptions"
        options={{
          header: (props) => <HomeHeader {...props} />,
        }}
      />
      <Stack.Screen
        name="subscription-editor"
        options={{
          header: (props) => <EditorHeader {...props} />,
        }}
      />
    </Stack>
  );
}
