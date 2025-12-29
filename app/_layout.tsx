import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppErrorBoundary } from '@/src/components/AppErrorBoundary';
import { AuthProvider } from '@/src/features/auth/AuthProvider';
import { RemoteConfigProvider } from '@/src/features/config/RemoteConfigContext';
import { setupNotificationHandler } from '@/src/features/notifications/notificationService';
import { initCurrencyRates } from '@/src/lib/currencyConversion';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 3_600_000, // 1 hour - we invalidate cache manually when data changes
    },
  },
});

function RootLayoutNav() {
  // Set up notification response handler on app mount
  useEffect(() => {
    const cleanup = setupNotificationHandler();
    return cleanup;
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerBackTitle: 'Back' }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen
          name="select-currency"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="select-frequency"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [ratesLoaded, setRatesLoaded] = React.useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && ratesLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, ratesLoaded]);

  // Initialize currency rates early in app lifecycle
  useEffect(() => {
    initCurrencyRates()
      .catch(() => {
        // Errors are handled internally; this prevents unhandled promise rejections
      })
      .finally(() => {
        setRatesLoaded(true);
      });
  }, []);

  if (!loaded || !ratesLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppErrorBoundary>
          <RemoteConfigProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </RemoteConfigProvider>
        </AppErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
