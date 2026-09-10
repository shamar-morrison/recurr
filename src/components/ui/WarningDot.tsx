import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT_FAMILY } from '@/src/constants/theme';

interface WarningDotProps {
  size?: number;
  testID?: string;
}

/**
 * Small amber badge with an exclamation mark, used to flag surfaces that
 * need the user's attention (e.g. disabled notifications).
 * Static colors read well in both light and dark themes.
 */
export function WarningDot({ size = 16, testID }: WarningDotProps) {
  const fontSize = Math.round(size * 0.7);
  return (
    <View
      style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }]}
      testID={testID}
    >
      <Text style={[styles.glyph, { fontSize, lineHeight: fontSize + 1 }]}>!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    color: '#1F2937',
    fontFamily: FONT_FAMILY.bold,
  },
});
