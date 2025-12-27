import { Redirect } from 'expo-router';
import React from 'react';

import { useAuth } from '@/src/features/auth/AuthProvider';

export default function Index() {
  const { isReady, user, hasCompletedOnboarding } = useAuth();

  if (!isReady) return null;

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)/(home)/subscriptions" />;
}
