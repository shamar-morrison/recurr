export type ColorScheme = 'light' | 'dark';

export interface AppColorPalette {
  // Primary Colors
  tint: string;
  primary: string;
  onPrimary: string;
  disabledTint: string;

  // Backgrounds
  background: string;
  card: string;
  cardAlt: string;
  surface: string;
  inputBackground: string;
  selectedBackground: string;
  badgeBackground: string;
  tertiaryBackground: string;
  negativeBackground: string;

  // Text
  text: string;
  secondaryText: string;

  // Borders
  border: string;

  // Status Colors
  positive: string;
  negative: string;
  warning: string;

  // Badge
  badge: string;
  badgeText: string;
}

export const LightColors: AppColorPalette = {
  tint: '#5E38F8',
  primary: '#5E38F8',
  onPrimary: '#FFFFFF',
  disabledTint: 'rgba(94, 56, 248, 0.35)',

  background: '#F2F4F7',
  card: '#FFFFFF',
  cardAlt: '#F9FAFB',
  surface: '#FFFFFF',
  inputBackground: 'rgba(15, 23, 42, 0.04)',
  selectedBackground: 'rgba(79, 140, 255, 0.08)',
  badgeBackground: 'rgba(79, 140, 255, 0.1)',
  tertiaryBackground: 'rgba(15, 23, 42, 0.06)',
  negativeBackground: 'rgba(255, 90, 90, 0.1)',

  text: '#101828',
  secondaryText: '#667085',

  border: '#E4E7EC',

  positive: '#17B26A',
  negative: '#F04438',
  warning: '#F79009',

  badge: 'rgba(15, 23, 42, 0.08)',
  badgeText: '#0B1220',
};

export const DarkColors: AppColorPalette = {
  tint: '#7C5CFF',
  primary: '#7C5CFF',
  onPrimary: '#FFFFFF',
  disabledTint: 'rgba(124, 92, 255, 0.4)',

  background: '#0B1220',
  card: '#151F2E',
  cardAlt: '#1A2433',
  surface: '#151F2E',
  inputBackground: 'rgba(255, 255, 255, 0.06)',
  selectedBackground: 'rgba(124, 92, 255, 0.15)',
  badgeBackground: 'rgba(124, 92, 255, 0.15)',
  tertiaryBackground: 'rgba(255, 255, 255, 0.06)',
  negativeBackground: 'rgba(240, 68, 56, 0.15)',

  text: '#FFFFFF',
  secondaryText: '#A0AEC0',

  border: '#2E3A4D',

  positive: '#14C87B',
  negative: '#F97066',
  warning: '#FDB022',

  badge: 'rgba(255, 255, 255, 0.1)',
  badgeText: '#E2E8F0',
};

// Export for backward compatibility (defaults to light)
export const AppColors = LightColors;

// Gradient color palettes
export const GRADIENTS = {
  premium: ['#5E38F8', '#7C5CFC', '#9B7DFF'] as const,
} as const;

// Category-specific colors for badges
import { SubscriptionCategory } from '@/src/features/subscriptions/types';

export const CATEGORY_COLORS: Record<SubscriptionCategory, { bg: string; text: string }> = {
  Streaming: { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366F1' }, // Indigo
  Music: { bg: 'rgba(34, 197, 94, 0.12)', text: '#16A34A' }, // Green
  Software: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6' }, // Blue
  Utilities: { bg: 'rgba(245, 158, 11, 0.12)', text: '#D97706' }, // Amber
  Health: { bg: 'rgba(20, 184, 166, 0.12)', text: '#0D9488' }, // Teal
  Food: { bg: 'rgba(249, 115, 22, 0.12)', text: '#EA580C' }, // Orange
  Education: { bg: 'rgba(6, 182, 212, 0.12)', text: '#0891B2' }, // Cyan
  Shopping: { bg: 'rgba(236, 72, 153, 0.12)', text: '#DB2777' }, // Pink
  AI: { bg: 'rgba(139, 92, 246, 0.12)', text: '#7C3AED' }, // Violet
  Other: { bg: 'rgba(168, 85, 247, 0.12)', text: '#9333EA' }, // Purple
};
