import { BORDER_RADIUS } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useServiceLogo } from '@/src/features/services/useServiceLogo';
import { Image, ImageErrorEventData } from 'expo-image';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type ServiceLogoProps = {
  /** Service name (used for fallback initials) */
  serviceName: string;
  /** Domain for logo lookup (e.g., 'netflix.com') */
  domain?: string;
  /** Size of the logo container (default: 52) */
  size?: number;
  /** Border radius (default: BORDER_RADIUS.xl) */
  borderRadius?: number;
  /** Background color for fallback (uses theme if not specified) */
  fallbackBackgroundColor?: string;
  /** Additional container style */
  style?: ViewStyle;
};

/**
 * Displays a service logo fetched from logo.dev.
 * Falls back to showing the first letter of the service name if:
 * - No domain is provided
 * - The logo fails to load (404, network error, etc.)
 */
export function ServiceLogo({
  serviceName,
  domain,
  size = 52,
  borderRadius = BORDER_RADIUS.xl,
  fallbackBackgroundColor,
  style,
}: ServiceLogoProps) {
  const { colors } = useTheme();
  const { logoUrl } = useServiceLogo(domain);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback((event: ImageErrorEventData) => {
    // Logo failed to load - show fallback
    setHasError(true);
  }, []);

  const bgColor = fallbackBackgroundColor ?? colors.cardAlt;

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius,
    ...style,
  };

  // Calculate proportional font size for initials
  const fontSize = Math.round(size * 0.35);
  const initial = (serviceName[0] ?? '?').toUpperCase();

  // Show logo if we have a URL and no error
  if (logoUrl && !hasError) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Image
          source={{ uri: logoUrl }}
          style={styles.image}
          contentFit="contain"
          transition={200}
          onError={handleError}
          cachePolicy="disk"
          recyclingKey={logoUrl}
        />
        {/* Fallback layer behind the image in case of transparent PNGs or slow loads */}
        <View style={[styles.fallbackLayer, { backgroundColor: bgColor, borderRadius }]}>
          <Text style={[styles.initialText, { fontSize, color: colors.text }]}>{initial}</Text>
        </View>
      </View>
    );
  }

  // Fallback: show first letter
  return (
    <View style={[styles.container, styles.fallback, containerStyle, { backgroundColor: bgColor }]}>
      <Text style={[styles.initialText, { fontSize, color: colors.text }]}>{initial}</Text>
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
    zIndex: 1,
  },
  fallbackLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  fallback: {},
  initialText: {
    fontWeight: '800',
  },
});
