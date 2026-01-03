import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Stack } from 'expo-router';
import React from 'react';

import { StackHeader } from '@/src/components/ui/StackHeader';
import { useTheme } from '@/src/context/ThemeContext';

function HomeHeader({ options }: NativeStackHeaderProps) {
  return (
    <StackHeader
      title="My Subscriptions"
      subtitle="Manage your recurring payments"
      headerRight={options.headerRight?.({ canGoBack: false })}
    />
  );
}

/**
 * Factory to create a simple header component with a configurable default title.
 */
function createSimpleHeader(defaultTitle: string) {
  return function SimpleHeader({ options, navigation }: NativeStackHeaderProps) {
    const title = typeof options.title === 'string' ? options.title : defaultTitle;
    const headerLeft = options.headerLeft?.({ canGoBack: navigation.canGoBack() });

    return <StackHeader title={title} headerLeft={headerLeft} />;
  };
}

const EditorHeader = createSimpleHeader('Subscription');
const DetailsHeader = createSimpleHeader('Details');
const HistoryHeader = createSimpleHeader('Payment History');
const SpendingHistoryHeader = createSimpleHeader('Spending History');

export default function HomeStackLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      initialRouteName="subscriptions"
      screenOptions={{
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
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
        name="subscription-details"
        options={{
          header: (props) => <DetailsHeader {...props} />,
        }}
      />
      <Stack.Screen
        name="subscription-editor"
        options={{
          header: (props) => <EditorHeader {...props} />,
        }}
      />
      <Stack.Screen
        name="payment-history"
        options={{
          header: (props) => <HistoryHeader {...props} />,
        }}
      />
      <Stack.Screen
        name="spending-history"
        options={{
          header: (props) => <SpendingHistoryHeader {...props} />,
        }}
      />
    </Stack>
  );
}
