import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/src/constants/theme';
import { CaretLeftIcon } from 'phosphor-react-native';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#6365E9', '#593CEF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Back Button */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <CaretLeftIcon size={24} color="#FFFFFF" weight="bold" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* App Icon */}
            <View style={styles.iconContainer}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.appIcon}
                resizeMode="cover"
              />
            </View>

            {/* App Name */}
            <Text style={styles.appName}>Recurr</Text>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Description */}
            <Text style={styles.description}>
              Recurr helps you track and manage all your recurring subscriptions in one place. Never
              miss a payment or forget about a subscription again.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingBottom: 60,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  appIcon: {
    width: 140,
    height: 140,
    borderRadius: 32,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    marginBottom: SPACING.lg,
  },
  separator: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: FONT_SIZE.lg,
    lineHeight: 26,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    maxWidth: 320,
  },
});
