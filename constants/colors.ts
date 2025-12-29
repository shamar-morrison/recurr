export const AppColors = {
  background: '#F2F4F7', // Lighter, clean background
  card: '#FFFFFF',
  cardAlt: '#F9FAFB', // Slight contrast for nested items
  text: '#101828', // Very dark blue/gray for primary text
  secondaryText: '#667085',
  border: '#E4E7EC', // Subtle border
  tint: '#5E38F8', // Vibrant Purple/Violet (Primary Brand)
  positive: '#17B26A', // Modern vibrant green
  negative: '#F04438', // Modern vibrant red
  warning: '#F79009',
  // New sematic tokens
  primary: '#5E38F8', // Alias for tint, used in semantic contexts
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF', // Alias for card, used in semantic contexts
  disabledTint: 'rgba(94, 56, 248, 0.35)',
  badge: 'rgba(15, 23, 42, 0.08)',
  badgeText: '#0B1220',
  inputBackground: 'rgba(15, 23, 42, 0.04)',
  selectedBackground: 'rgba(79, 140, 255, 0.08)',
  badgeBackground: 'rgba(79, 140, 255, 0.1)',
  tertiaryBackground: 'rgba(15, 23, 42, 0.06)',
  negativeBackground: 'rgba(255, 90, 90, 0.1)',
} as const;

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
