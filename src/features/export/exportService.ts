import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Subscription } from '@/src/features/subscriptions/types';

/**
 * Formats a timestamp to a human-readable date string
 */
function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Escapes a value for CSV (handles commas, quotes, and newlines)
 */
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * CSV column headers
 */
const CSV_HEADERS = [
  'ID',
  'Service Name',
  'Category',
  'Amount',
  'Currency',
  'Billing Cycle',
  'Billing Day',
  'Start Date',
  'End Date',
  'Payment Method',
  'Notes',
  'Archived',
  'Reminder Days',
  'Reminder Hour (24h)',
  'Created At',
  'Updated At',
];

/**
 * Generates CSV content from subscriptions
 */
export function generateCSV(subscriptions: Subscription[]): string {
  const rows: string[] = [];

  // Header row
  rows.push(CSV_HEADERS.join(','));

  // Data rows
  for (const sub of subscriptions) {
    const row = [
      escapeCSV(sub.id),
      escapeCSV(sub.serviceName),
      escapeCSV(sub.category),
      escapeCSV(sub.amount),
      escapeCSV(sub.currency),
      escapeCSV(sub.billingCycle),
      escapeCSV(sub.billingDay),
      escapeCSV(formatDate(sub.startDate)),
      escapeCSV(formatDate(sub.endDate)),
      escapeCSV(sub.paymentMethod ?? ''),
      escapeCSV(sub.notes ?? ''),
      escapeCSV(sub.isArchived ? 'Yes' : 'No'),
      escapeCSV(sub.reminderDays ?? ''),
      escapeCSV(sub.reminderHour ?? ''),
      escapeCSV(formatDate(sub.createdAt)),
      escapeCSV(formatDate(sub.updatedAt)),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Generates Markdown table content from subscriptions
 */
export function generateMarkdown(subscriptions: Subscription[]): string {
  const lines: string[] = [];

  // Title
  lines.push('# Subscription Export');
  lines.push('');
  lines.push(`Exported on: ${new Date().toLocaleDateString()}`);
  lines.push('');

  if (subscriptions.length === 0) {
    lines.push('No subscriptions to export.');
    return lines.join('\n');
  }

  // Table header
  lines.push('| Service | Category | Amount | Billing Cycle | Billing Day | Payment Method |');
  lines.push('|---------|----------|--------|---------------|-------------|----------------|');

  // Table rows
  for (const sub of subscriptions) {
    const amount = `${sub.currency} ${sub.amount.toFixed(2)}`;
    const row = [
      sub.serviceName,
      sub.category,
      amount,
      sub.billingCycle,
      sub.billingDay,
      sub.paymentMethod ?? '-',
    ];
    lines.push(`| ${row.join(' | ')} |`);
  }

  lines.push('');
  lines.push(`Total: ${subscriptions.length} subscription(s)`);

  return lines.join('\n');
}

export type ExportFormat = 'csv' | 'markdown';

/**
 * Exports subscription data to a file and opens the share sheet
 */
export async function exportData(
  subscriptions: Subscription[],
  format: ExportFormat,
  includeArchived: boolean
): Promise<void> {
  // Filter subscriptions based on archive preference
  const filteredSubs = includeArchived
    ? subscriptions
    : subscriptions.filter((sub) => !sub.isArchived);

  // Generate content based on format
  const content = format === 'csv' ? generateCSV(filteredSubs) : generateMarkdown(filteredSubs);

  // Determine file extension and name
  const extension = format === 'csv' ? 'csv' : 'md';
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `subscriptions_${timestamp}.${extension}`;

  // Write to cache directory using new File API
  const file = new File(Paths.cache, fileName);
  await file.write(content);

  // Check if sharing is available
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  // Open share sheet
  await Sharing.shareAsync(file.uri, {
    mimeType: format === 'csv' ? 'text/csv' : 'text/markdown',
    dialogTitle: 'Export Subscriptions',
  });
}
