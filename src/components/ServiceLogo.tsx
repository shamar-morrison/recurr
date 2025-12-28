import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppColors } from '@/constants/colors';
import { useServiceLogo } from '@/src/features/services/useServiceLogo';

type ServiceLogoProps = {
  /** Service name (used for fallback initials) */
  serviceName: string;
  /** Domain for logo lookup (e.g., 'netflix.com') */
  domain?: string;
  /** Size of the logo container (default: 52) */
  size?: number;
  /** Border radius (default: 16) */
  borderRadius?: number;
  /** Background color for fallback (default: AppColors.inputBackground) */
  fallbackBackgroundColor?: string;
  /** Additional container style */
  style?: ViewStyle;
};

/**
 * Displays a service logo fetched from logo.dev.
 * Falls back to showing the first letter of the service name if
 * the logo cannot be fetched or domain is not provided.
 */
export function ServiceLogo({
  serviceName,
  domain,
  size = 52,
  borderRadius = 16,
  fallbackBackgroundColor = '#F2F4F7',
  style,
}: ServiceLogoProps) {
  const { logoUrl, isLoading } = useServiceLogo(domain);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius,
    ...style,
  };

  // Calculate proportional font size for initials
  const fontSize = Math.round(size * 0.35);

  // Show logo if available
  if (logoUrl && !isLoading) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Image
          source={{ uri: logoUrl }}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />
      </View>
    );
  }

  // Fallback: show first letter
  const initial = (serviceName[0] ?? '?').toUpperCase();

  return (
    <View
      style={[
        styles.container,
        styles.fallback,
        containerStyle,
        { backgroundColor: fallbackBackgroundColor },
      ]}
    >
      <Text style={[styles.initialText, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    backgroundColor: '#F2F4F7',
  },
  initialText: {
    color: AppColors.text,
    fontWeight: '800',
  },
});
