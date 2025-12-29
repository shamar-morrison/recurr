import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { Button } from '@/src/components/ui/Button';
import { FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useAuth } from '@/src/features/auth/AuthProvider';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithGoogle, user, isReady } = useAuth();

  // Redirect to home when user successfully logs in
  useEffect(() => {
    if (isReady && user) {
      router.replace('/');
    }
  }, [isReady, user, router]);

  const [isWorking, setIsWorking] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setIsWorking(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      // Error handling is done in signInWithGoogle - just log here
      console.log('[auth screen] Google sign-in error:', e);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['#FFFFFF', '#E0E7FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to Recurr</Text>
              <Text style={styles.subtitle}>
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
              style={styles.googleButton}
              textStyle={styles.googleButtonText}
            />
          </View>

          <Text style={styles.footer}>
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
    // backgroundColor removed to show gradient
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
  title: {
    color: AppColors.text,
    fontSize: FONT_SIZE.hero,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.lg,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    color: '#1E293B',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  footer: {
    color: AppColors.secondaryText,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    opacity: 0.6,
  },
});
