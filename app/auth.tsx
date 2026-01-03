import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithGoogle, user, isReady } = useAuth();
  const { colors, isDark } = useTheme();

  // Redirect to home when user successfully logs in
  useEffect(() => {
    if (isReady && user) {
      router.replace('/');
    }
  }, [isReady, user, router]);

  const [isWorking, setIsWorking] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setIsWorking(true);

    // Allow React to render the loading spinner before the native Google
    // sign-in sheet blocks the JS thread
    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      await signInWithGoogle();
    } catch (e) {
      // Error handling is done in signInWithGoogle - just log here
      console.log('[auth screen] Google sign-in error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  // Use different gradients for light/dark mode
  const gradientColors = isDark
    ? (['#0B1220', '#1a1a2e'] as const)
    : (['#FFFFFF', '#E0E7FF'] as const);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/react-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.title, { color: colors.text }]}>Welcome to Recurr</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
                Sign in to keep your subscriptions synced across all your devices.
              </Text>
            </View>

            <Button
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              loading={isWorking}
              variant="secondary"
              size="lg"
              icon={
                <Image
                  source={require('@/assets/images/google-icon.png')}
                  style={styles.googleIcon}
                />
              }
              style={[
                styles.googleButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              textStyle={[styles.googleButtonText, { color: colors.text }]}
            />
          </View>

          <Text style={[styles.footer, { color: colors.secondaryText }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 40,
  },
  header: {
    gap: SPACING.md,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.hero,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  googleButton: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  footer: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    opacity: 0.6,
  },
});
