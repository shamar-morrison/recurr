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
  primary: '#5E38F8',
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  disabledTint: 'rgba(94, 56, 248, 0.35)',
  badge: 'rgba(15, 23, 42, 0.08)',
  badgeText: '#0B1220',
} as const;

// Category-specific colors for badges
import { SubscriptionCategory } from '@/src/features/subscriptions/types';

export const CATEGORY_COLORS: Record<SubscriptionCategory, { bg: string; text: string }> = {
  Streaming: { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366F1' }, // Indigo
  Music: { bg: 'rgba(34, 197, 94, 0.12)', text: '#16A34A' }, // Green
  Software: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6' }, // Blue
  Utilities: { bg: 'rgba(245, 158, 11, 0.12)', text: '#D97706' }, // Amber
  Other: { bg: 'rgba(168, 85, 247, 0.12)', text: '#9333EA' }, // Purple
};
