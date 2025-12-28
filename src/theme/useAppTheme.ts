import { AppColors } from '@/constants/colors';

export type AppThemeColors = {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  secondaryText: string;
  border: string;
  tint: string;
  positive: string;
  negative: string;
  warning: string;
  primary: string;
  onPrimary: string;
  surface: string;
};

export type AppTheme = {
  isDark: boolean;
  colors: AppThemeColors;
};

/**
 * Static light theme - dark mode is not supported.
 * This is a constant, so components can use it without hooks if needed.
 */
export const lightTheme: AppTheme = {
  isDark: false,
  colors: AppColors.light as unknown as AppThemeColors,
};

/**
 * Returns the app theme (always light mode).
 * For components, prefer using this hook for consistency.
 */
export function useAppTheme(): AppTheme {
  return lightTheme;
}
