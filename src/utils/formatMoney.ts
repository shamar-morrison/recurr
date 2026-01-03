/**
 * Formats a monetary amount with currency symbol using Intl.NumberFormat.
 *
 * @param amount - The amount to format
 * @param currency - ISO 4217 currency code (defaults to 'USD')
 * @param compact - If true, abbreviates large numbers (e.g., $1.2K)
 * @returns Formatted currency string
 */
export function formatMoney(
  amount: number,
  currency: string = 'USD',
  compact: boolean = false
): string {
  try {
    const safe = Number.isFinite(amount) ? amount : 0;

    if (compact && safe >= 1000) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency || 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(safe);
    }

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    // Fallback for invalid currency codes
    const safe = Number.isFinite(amount) ? amount : 0;
    return `${safe.toFixed(2)} ${currency || 'USD'}`;
  }
}
