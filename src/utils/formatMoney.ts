/**
 * Formats a monetary amount with currency symbol using Intl.NumberFormat.
 *
 * @param amount - The amount to format
 * @param currency - ISO 4217 currency code (defaults to 'USD')
 * @returns Formatted currency string
 */
export function formatMoney(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    // Fallback for invalid currency codes
    const safe = Number.isFinite(amount) ? amount : 0;
    return `${safe.toFixed(2)} ${currency || 'USD'}`;
  }
}
