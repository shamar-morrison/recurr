/**
 * Payment Success Screen
 *
 * Displayed after a successful premium purchase.
 * Shows a celebratory message and a button to go back home.
 */

import { Motion } from '@legendapp/motion';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import {
  CrownIcon,
  SparklesIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/src/components/ui/AppIcon';

import { AppColors, GRADIENTS } from '@/constants/colors';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZE, SHADOWS, SPACING } from '@/src/constants/theme';
import { getPremiumFeatures } from '@/src/features/monetization/premiumFeatures';

export default function PaymentSuccessScreen() {
  const handleGoHome = () => {
    // Navigate to home and reset the stack
    router.replace('/(tabs)/(home)/subscriptions');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <LinearGradient
        colors={[...GRADIENTS.premium]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.container}>
            {/* Success Animation */}
            <Motion.View
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              style={styles.iconContainer}
            >
              <View style={styles.successCircle}>
              <View style={[styles.paidBadge, { backgroundColor: '#22C55E' }]}>
                <AppIcon icon={Tick02Icon} size={36} color="#fff" />
              </View>
              </View>
              <Motion.View
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 200 }}
                style={styles.crownBadge}
              >
                <AppIcon icon={CrownIcon} size={24} color="#FFD700" fill="#FFD700" />
              </Motion.View>
            </Motion.View>

            {/* Success Message */}
            <Motion.View
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 300 }}
              style={styles.messageContainer}
            >
              <Text style={styles.title}>You're Premium!</Text>
              <Text style={styles.subtitle}>
                Thank you for your purchase. Enjoy unlimited access to all features!
              </Text>
            </Motion.View>

            {/* Sparkle decorations */}
            <Motion.View
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 800, delay: 500 }}
              style={styles.sparklesContainer}
            >
              <AppIcon
                icon={SparklesIcon}
                size={24}
                color="rgba(255, 215, 0, 0.8)"
                fill="rgba(255, 215, 0, 0.8)"
                style={styles.sparkle1}
              />
              <AppIcon
                icon={SparklesIcon}
                size={16}
                color="rgba(255, 215, 0, 0.6)"
                fill="rgba(255, 215, 0, 0.6)"
                style={styles.sparkle2}
              />
              <AppIcon
                icon={SparklesIcon}
                size={20}
                color="rgba(255, 215, 0, 0.7)"
                fill="rgba(255, 215, 0, 0.7)"
                style={styles.sparkle3}
              />
            </Motion.View>

            {/* Features unlocked */}
            <Motion.View
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 600 }}
              style={styles.featuresCard}
            >
              <Text style={styles.featuresTitle}>What's unlocked:</Text>
              {getPremiumFeatures(0).map((feature) => (
                <View key={feature.id} style={styles.featureRow}>
                  <View style={[styles.miniPaidBadge, { backgroundColor: '#22C55E' }]}>
                    <AppIcon icon={Tick02Icon} size={12} color="#fff" />
                  </View>
                  <Text style={styles.featureText}>{feature.shortTitle}</Text>
                </View>
              ))}
            </Motion.View>
          </View>

          {/* Bottom Button */}
          <Motion.View
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 800 }}
            style={styles.buttonContainer}
          >
            <Pressable onPress={handleGoHome} style={styles.homeButton}>
              <Text style={styles.homeButtonText}>Go to Home</Text>
            </Pressable>
          </Motion.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: SPACING.xl,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  paidBadge: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPaidBadge: {
    width: 18,
    height: 18,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZE.hero,
    fontFamily: FONT_FAMILY.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 24,
  },
  sparklesContainer: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    height: 100,
  },
  sparkle1: {
    position: 'absolute',
    left: '15%',
    top: 10,
  },
  sparkle2: {
    position: 'absolute',
    right: '20%',
    top: 40,
  },
  sparkle3: {
    position: 'absolute',
    left: '25%',
    top: 70,
  },
  featuresCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    width: '100%',
    gap: SPACING.sm,
  },
  featuresTitle: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONT_FAMILY.bold,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.medium,
  },
  buttonContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  homeButtonText: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONT_FAMILY.bold,
    color: AppColors.tint,
    letterSpacing: -0.2,
  },
});
