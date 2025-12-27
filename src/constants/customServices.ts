/**
 * Custom services created by users.
 * Stored in Firebase under users/{userId}/customServices
 */

import { SubscriptionCategory } from '@/src/features/subscriptions/types';

export interface CustomService {
  id: string;
  name: string;
  category: SubscriptionCategory;
  color: string;
  createdAt: number;
}

export type CustomServiceInput = Omit<CustomService, 'id' | 'createdAt'>;

/**
 * 8 vibrant colors for custom services
 */
export const SERVICE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
] as const;

export type ServiceColor = (typeof SERVICE_COLORS)[number];
