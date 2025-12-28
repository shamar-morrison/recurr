import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Stack } from 'expo-router';
import React from 'react';

import { AppColors } from '@/constants/colors';
import { StackHeader } from '@/src/components/ui/StackHeader';

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
  const headerLeft = options.headerLeft?.({ canGoBack: navigation.canGoBack() });

  return <StackHeader title={title} headerLeft={headerLeft} />;
}

export default function HomeStackLayout() {
  const theme = { colors: AppColors };

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
