import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { EyeIcon, EyeSlashIcon } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/features/auth/AuthProvider';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithEmailPassword, signInWithGoogle, user, isReady } = useAuth();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [workingMethod, setWorkingMethod] = useState<'email' | 'google' | null>(null);

  // Redirect to home when user successfully logs in
  useEffect(() => {
    if (isReady && user) {
      router.replace('/');
    }
  }, [isReady, user, router]);

  const handleGoogleSignIn = async () => {
    setWorkingMethod('google');

    // Allow React to render the loading spinner before the native Google
    // sign-in sheet blocks the JS thread
    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      await signInWithGoogle();
    } catch (e) {
      // Error handling is done in signInWithGoogle - just log here
      console.log('[auth screen] Google sign-in error:', e);
    } finally {
      setWorkingMethod(null);
    }
  };

  const handleEmailSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const hasPassword = password.trim().length > 0;

    if (!normalizedEmail || !hasPassword) {
      Alert.alert('Missing information', 'Enter your email and password to continue.');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setWorkingMethod('email');

    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      await signInWithEmailPassword(normalizedEmail, password);
    } catch (e) {
      console.log('[auth screen] Email sign-in error:', e);
    } finally {
      setWorkingMethod(null);
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
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.container}>
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

                  <View style={styles.authSection}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Email"
                      placeholderTextColor={colors.secondaryText}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      editable={!workingMethod}
                      returnKeyType="next"
                    />
                    <View
                      style={[
                        styles.passwordInputWrapper,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor={colors.secondaryText}
                        secureTextEntry={!isPasswordVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password"
                        textContentType="password"
                        style={[styles.passwordInput, { color: colors.text }]}
                        editable={!workingMethod}
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          void handleEmailSignIn();
                        }}
                      />
                      <Pressable
                        onPress={() => setIsPasswordVisible((prev) => !prev)}
                        disabled={Boolean(workingMethod)}
                        accessibilityRole="button"
                        accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                        hitSlop={8}
                        style={styles.passwordToggle}
                      >
                        {isPasswordVisible ? (
                          <EyeSlashIcon color={colors.secondaryText} size={20} />
                        ) : (
                          <EyeIcon color={colors.secondaryText} size={20} />
                        )}
                      </Pressable>
                    </View>

                    <Button
                      title="Continue with Email"
                      onPress={handleEmailSignIn}
                      loading={workingMethod === 'email'}
                      disabled={Boolean(workingMethod)}
                      variant="primary"
                      size="lg"
                    />

                    <View style={styles.dividerRow}>
                      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                      <Text style={[styles.dividerText, { color: colors.secondaryText }]}>or</Text>
                      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    </View>

                    <Button
                      title="Continue with Google"
                      onPress={handleGoogleSignIn}
                      loading={workingMethod === 'google'}
                      disabled={Boolean(workingMethod)}
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
                </View>

                <Text style={[styles.footer, { color: colors.secondaryText }]}>
                  By continuing, you agree to our{' '}
                  <Text
                    style={{ textDecorationLine: 'underline' }}
                    onPress={() =>
                      Linking.openURL('https://privacy-policies-psi.vercel.app/recurr/terms')
                    }
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={{ textDecorationLine: 'underline' }}
                    onPress={() =>
                      Linking.openURL('https://privacy-policies-psi.vercel.app/recurr/privacy')
                    }
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: SPACING.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 40,
  },
  authSection: {
    gap: SPACING.md,
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
  input: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    borderWidth: 1,
  },
  passwordInputWrapper: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.full,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    paddingVertical: SPACING.lg,
  },
  passwordToggle: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
