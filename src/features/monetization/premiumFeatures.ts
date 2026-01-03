/**
 * Premium Features Configuration
 *
 * Single source of truth for premium feature definitions.
 * Used by both the paywall and payment success screens.
 */

import {
  BellIcon,
  ChartBarIcon,
  ExportIcon,
  IconProps,
  LightningIcon,
} from 'phosphor-react-native';

export interface PremiumFeature {
  /** Unique identifier for the feature */
  id: string;
  /** Display title shown on paywall */
  title: string;
  /** Short label for success screen */
  shortTitle: string;
  /** Description shown on paywall */
  description: string;
  /** Icon component */
  icon: React.ComponentType<IconProps>;
}

/**
 * Creates the premium features list with dynamic values.
 * @param freeTierLimit - The current free tier subscription limit
 */
export function getPremiumFeatures(freeTierLimit: number): PremiumFeature[] {
  return [
    {
      id: 'unlimited-subscriptions',
      title: 'Unlimited Subscriptions',
      shortTitle: 'Unlimited subscriptions',
      description: `Track all your subscriptions without limits. Free users can only track ${freeTierLimit}.`,
      icon: LightningIcon,
    },
    {
      id: 'export-data',
      title: 'Export Your Data',
      shortTitle: 'Export to CSV & Markdown',
      description: 'Export to CSV or Markdown anytime. Keep your data portable and backed up.',
      icon: ExportIcon,
    },
    {
      id: 'unlimited-reminders',
      title: 'Unlimited Reminders',
      shortTitle: 'Unlimited reminders',
      description: 'Never miss a payment. Set as many reminders as you need.',
      icon: BellIcon,
    },
    {
      id: 'detailed-reports',
      title: 'Detailed Reports',
      shortTitle: 'Detailed reports & analytics',
      description: 'Access charts, trends and analytics to understand your spending patterns.',
      icon: ChartBarIcon,
    },
  ];
}
