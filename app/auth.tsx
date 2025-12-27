import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/src/features/auth/AuthProvider';
import { useAppTheme } from '@/src/theme/useAppTheme';

export default function AuthScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { signInEmail, signUpEmail, signInWithGoogleMock, isFirebaseReady, user, isReady } =
    useAuth();

  // Redirect to home when user successfully logs in
  useEffect(() => {
    if (isReady && user) {
      router.replace('/');
    }
  }, [isReady, user, router]);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isWorking, setIsWorking] = useState<boolean>(false);

  const submit = async () => {
    setIsWorking(true);
    try {
      if (!isFirebaseReady) {
        Alert.alert(
          'Firebase not configured',
          'Set EXPO_PUBLIC_FIREBASE_* env vars to enable auth.'
        );
        return;
      }
      if (mode === 'signin') {
        await signInEmail(email.trim(), password);
      } else {
        await signUpEmail(email.trim(), password);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Auth failed', msg);
    } finally {
      setIsWorking(false);
    }
  };

  const googleMock = async () => {
    setIsWorking(true);
    try {
      await signInWithGoogleMock();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Google sign-in (mock) failed', msg);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container} testID="authScreen">
        <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to keep your subscriptions synced.'
            : 'Start tracking and avoid forgotten charges.'}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@domain.com"
            placeholderTextColor={theme.isDark ? 'rgba(236,242,255,0.5)' : 'rgba(15,23,42,0.35)'}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            testID="authEmail"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={theme.isDark ? 'rgba(236,242,255,0.5)' : 'rgba(15,23,42,0.35)'}
            secureTextEntry
            style={styles.input}
            testID="authPassword"
          />

          <Pressable
            onPress={submit}
            disabled={isWorking}
            style={[styles.primary, { backgroundColor: theme.colors.tint }]}
            testID="authSubmit"
          >
            {isWorking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            style={styles.switch}
            testID="authSwitchMode"
          >
            <Text style={styles.switchText}>
              {mode === 'signin'
                ? 'New here? Create an account'
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            onPress={googleMock}
            disabled={isWorking}
            style={styles.google}
            testID="authGoogleMock"
          >
            <Text style={styles.googleText}>Continue with Google (mock)</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      paddingTop: 48,
      backgroundColor: theme.colors.background,
    },
    title: {
      color: theme.colors.text,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.9,
      marginBottom: 6,
    },
    subtitle: {
      color: theme.colors.secondaryText,
      fontSize: 14,
      lineHeight: 18,
      marginBottom: 14,
      maxWidth: 360,
    },
    card: {
      borderRadius: 24,
      padding: 16,
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      gap: 10,
    },
    label: {
      color: theme.colors.secondaryText,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginTop: 6,
    },
    input: {
      height: 48,
      borderRadius: 16,
      paddingHorizontal: 14,
      color: theme.colors.text,
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.06)' : 'rgba(15,23,42,0.05)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    primary: {
      marginTop: 6,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryText: {
      color: '#fff',
      fontWeight: '900',
      fontSize: 15,
    },
    switch: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    switchText: {
      color: theme.colors.tint,
      fontWeight: '800',
      fontSize: 13,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginVertical: 6,
    },
    google: {
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: theme.isDark ? 'rgba(236,242,255,0.08)' : 'rgba(15,23,42,0.06)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    googleText: {
      color: theme.colors.text,
      fontWeight: '900',
      fontSize: 14,
      letterSpacing: -0.1,
    },
  });
}
