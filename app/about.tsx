import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { CaretLeftIcon } from 'phosphor-react-native';

export default function AboutScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <CaretLeftIcon size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* App Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>

        {/* App Name & Version */}
        <Text style={[styles.appName, { color: colors.text }]}>Recurr</Text>
        <Text style={[styles.version, { color: colors.secondaryText }]}>Version 1.0.0</Text>

        {/* Description */}
        <View style={[styles.descriptionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            Recurr helps you track and manage all your recurring subscriptions in one place. Never
            miss a payment or forget about a subscription again.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: colors.secondaryText }]}>
            © 2024 Horizon Apps
          </Text>
          <Text style={[styles.madeWith, { color: colors.secondaryText }]}>Made with ❤️</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.xxl,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingTop: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
  },
  appName: {
    fontSize: FONT_SIZE.display,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  version: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
  descriptionCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginTop: SPACING.xxxl,
    width: '100%',
  },
  description: {
    fontSize: FONT_SIZE.lg,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  copyright: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  madeWith: {
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.xs,
  },
});
