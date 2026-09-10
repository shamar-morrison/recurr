/**
 * Centralized design tokens for the app.
 * Use these tokens throughout the app for consistent styling.
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 999,
} as const;

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
  hero: 32,
} as const;

/**
 * Inter font families (loaded at startup via `@expo-google-fonts/inter`,
 * see `app/_layout.tsx`).
 *
 * Rules (mirrors showseek):
 * - Use the family matching the weight instead of setting `fontWeight`
 *   (Android ignores/mismatches `fontWeight` on custom font families).
 * - Weights 800/900 map to `bold` (capped at 700).
 */
export const FONT_FAMILY = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Maps a `fontWeight` value to its Inter family (800/900 capped at bold). */
export const FONT_WEIGHT_TO_FAMILY: Record<string, string> = {
  '400': FONT_FAMILY.regular,
  normal: FONT_FAMILY.regular,
  '500': FONT_FAMILY.medium,
  '600': FONT_FAMILY.semiBold,
  '700': FONT_FAMILY.bold,
  bold: FONT_FAMILY.bold,
  '800': FONT_FAMILY.bold,
  '900': FONT_FAMILY.bold,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
} as const;

// Type exports for type-safe usage
export type Spacing = keyof typeof SPACING;
export type BorderRadius = keyof typeof BORDER_RADIUS;
export type FontSize = keyof typeof FONT_SIZE;
export type FontFamily = keyof typeof FONT_FAMILY;
export type Shadow = keyof typeof SHADOWS;
