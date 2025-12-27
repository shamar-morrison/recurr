import { useColorScheme } from 'react-native';

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

export function useAppTheme(): AppTheme {
  const isDark = false; // TODO: Implement theme switcher, forcing light for now as requested

  const colors = (isDark ? AppColors.dark : AppColors.light) as unknown as AppThemeColors;

  return {
    isDark,
    colors,
  };
}
