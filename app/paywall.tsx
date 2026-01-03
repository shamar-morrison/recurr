import { Motion } from '@legendapp/motion';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import {
  BellIcon,
  ChartBarIcon,
  CrownIcon,
  ExportIcon,
  LightningIcon,
  SparkleIcon,
} from 'phosphor-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, GRADIENTS } from '@/constants/colors';
import { BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING } from '@/src/constants/theme';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useRemoteConfig } from '@/src/features/config/useRemoteConfig';
import { FeatureItem } from '@/src/features/monetization/FeatureItem';
import { useIAP } from '@/src/features/monetization/IAPProvider';
import { PREMIUM_PRODUCT_ID } from '@/src/features/monetization/iapService';

// Premium features configuration - easily extensible for future features

export default function PaywallScreen() {
  const { isPremium, user } = useAuth();
  const { isLoading, purchase, restore, products } = useIAP();
  const { freeTierLimit, loading: configLoading, error: configError } = useRemoteConfig();

  const premiumProduct = products.find((p) => p.id === PREMIUM_PRODUCT_ID);
  const formattedPrice = premiumProduct?.displayPrice ?? '$5';

  const premiumFeatures = React.useMemo(
    () => [
      {
        title: 'Unlimited Subscriptions',
        description: `Track all your subscriptions without limits. Free users can only track ${freeTierLimit}.`,
        icon: LightningIcon,
      },
      {
        title: 'Export Your Data',
        description: 'Export to CSV or Markdown anytime. Keep your data portable and backed up.',
        icon: ExportIcon,
      },
      {
        title: 'Unlimited Reminders',
        description: 'Never miss a payment. Set as many reminders as you need.',
        icon: BellIcon,
      },
      {
        title: 'Detailed Reports',
        description: 'Access charts, trends and analytics to understand your spending patterns.',
        icon: ChartBarIcon,
      },
    ],
    [freeTierLimit]
  );

  const canPurchase = Boolean(user);

  const handlePurchase = async () => {
    if (!canPurchase) {
      Alert.alert('Sign In Required', 'Please sign in to unlock Premium features.');
      return;
    }

    await purchase();
    // Navigation to success screen is handled by IAPProvider after validation
  };

  if (configLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AppColors.tint} />
      </View>
    );
  }

  if (configError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Unable to load configuration.</Text>
        <Text style={styles.errorSubtext}>
          Please check your internet connection and try again.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleRestore = async () => {
    if (!canPurchase) {
      Alert.alert('Sign In Required', 'Please sign in to restore purchases.');
      return;
    }

    const restored = await restore();
    if (restored) {
      // Navigate to success screen after restore
      router.replace('/payment-success');
    }
  };

  if (isPremium) {
    return (
      <>
        <Stack.Screen options={{ title: 'Premium', headerShown: false }} />
        <LinearGradient
          colors={[...GRADIENTS.premium]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <View style={styles.premiumActiveContainer}>
              <Motion.View
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                style={styles.crownContainerLarge}
              >
                <CrownIcon size={64} color="#FFD700" weight="fill" />
              </Motion.View>

              <Text style={styles.premiumActiveTitle}>You're Premium!</Text>
              <Text style={styles.premiumActiveSubtitle}>
                Enjoy unlimited access to all features
              </Text>

              <Pressable
                onPress={() => router.back()}
                style={styles.doneButton}
                testID="paywallDone"
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Premium', headerShown: false }} />
      <LinearGradient
        colors={[...GRADIENTS.premium]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Motion.View
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                style={styles.crownContainer}
              >
                <View style={styles.crownGlow} />
                <CrownIcon size={48} color="#FFD700" weight="fill" />
              </Motion.View>

              <Motion.View
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 200 }}
              >
                <Text style={styles.heroTitle} testID="paywallTitle">
                  Go Premium
                </Text>
                <Text style={styles.heroSubtitle}>
                  Unlock the full power of subscription tracking
                </Text>
              </Motion.View>
            </View>

            {/* Pricing Card */}
            <Motion.View
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 300 }}
              style={styles.pricingCard}
            >
              <View style={styles.pricingHeader}>
                <SparkleIcon size={20} color={AppColors.tint} weight="fill" />
                <Text style={styles.pricingLabel}>LIFETIME ACCESS</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>{formattedPrice}</Text>
              </View>
              <Text style={styles.priceNote}>One-time payment • No subscription</Text>
            </Motion.View>

            {/* Features Card */}
            <Motion.View
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 400 }}
              style={styles.featuresCard}
            >
              <Text style={styles.sectionTitle}>What you get</Text>

              <View style={styles.featuresList}>
                {premiumFeatures.map((feature, index) => (
                  <FeatureItem
                    key={feature.title}
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    index={index}
                  />
                ))}
              </View>
            </Motion.View>

            {/* Comparison */}
            <Motion.View
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 500 }}
              style={styles.comparisonCard}
            >
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonBadgeFree}>
                  <Text style={styles.comparisonBadgeText}>FREE</Text>
                </View>
                <Text style={styles.comparisonText}>Up to {freeTierLimit} subscriptions</Text>
              </View>
              <View style={styles.comparisonDivider} />
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonBadgePremium}>
                  <Text style={styles.comparisonBadgeTextPremium}>PRO</Text>
                </View>
                <Text style={styles.comparisonText}>Unlimited + All features</Text>
              </View>
            </Motion.View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.actionsContainer}>
            <Pressable
              disabled={isLoading}
              onPress={handlePurchase}
              style={styles.purchaseButton}
              testID="paywallPurchase"
            >
              {isLoading ? (
                <ActivityIndicator color={AppColors.tint} />
              ) : (
                <>
                  <CrownIcon size={20} color={AppColors.tint} weight="fill" />
                  <Text style={styles.purchaseButtonText}>Unlock Premium • {formattedPrice}</Text>
                </>
              )}
            </Pressable>

            <Pressable
              disabled={isLoading}
              onPress={handleRestore}
              style={styles.restoreButton}
              testID="paywallRestore"
            >
              <Text style={styles.restoreButtonText}>Restore Purchase</Text>
            </Pressable>

            {!canPurchase && <Text style={styles.helperText}>Sign in first to unlock Premium</Text>}
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    gap: SPACING.lg,
  },
  crownContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crownGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  heroTitle: {
    fontSize: FONT_SIZE.hero,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.lg,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Pricing Card
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  pricingLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: AppColors.tint,
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceCurrency: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: AppColors.text,
    marginTop: SPACING.xs,
  },
  priceAmount: {
    fontSize: 64,
    fontWeight: '900',
    color: AppColors.text,
    letterSpacing: -2,
    lineHeight: 72,
  },
  priceNote: {
    fontSize: FONT_SIZE.sm,
    color: AppColors.secondaryText,
    marginTop: SPACING.xs,
  },

  // Features Card
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: AppColors.text,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  featuresList: {
    gap: SPACING.sm,
  },

  // Comparison Card
  comparisonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.lg,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  comparisonBadgeFree: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  comparisonBadgePremium: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#FFD700',
  },
  comparisonBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  comparisonBadgeTextPremium: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: AppColors.tint,
    letterSpacing: 0.5,
  },
  comparisonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  comparisonDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: SPACING.md,
  },

  // Actions
  actionsContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    ...SHADOWS.lg,
  },
  purchaseButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: AppColors.tint,
    letterSpacing: -0.2,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  restoreButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  helperText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },

  // Premium Active State
  premiumActiveContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  crownContainerLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumActiveTitle: {
    fontSize: FONT_SIZE.hero,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  premiumActiveSubtitle: {
    fontSize: FONT_SIZE.lg,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  doneButton: {
    marginTop: SPACING.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxl * 2,
    ...SHADOWS.lg,
  },
  doneButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: AppColors.tint,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: '#fff',
    gap: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: AppColors.text,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: FONT_SIZE.md,
    color: AppColors.secondaryText,
    textAlign: 'center',
  },
  errorButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: AppColors.tint,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.md,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
