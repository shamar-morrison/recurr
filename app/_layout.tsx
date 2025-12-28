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
import { useAppTheme } from '@/src/theme/useAppTheme';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60_000, // 1 minute
    },
  },
});

function RootLayoutNav() {
  const theme = useAppTheme();

  return (
    <GluestackUIProvider>
      <>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerBackTitle: 'Back' }}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen
            name="select-service"
            options={{ presentation: 'formSheet', headerShown: false }}
          />
          <Stack.Screen
            name="select-currency"
            options={{ presentation: 'formSheet', headerShown: false }}
          />
          <Stack.Screen
            name="select-frequency"
            options={{ presentation: 'formSheet', headerShown: false }}
          />
          <Stack.Screen
            name="add-service"
            options={{ presentation: 'formSheet', headerShown: false }}
          />
        </Stack>
      </>
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppErrorBoundary>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </AppErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
