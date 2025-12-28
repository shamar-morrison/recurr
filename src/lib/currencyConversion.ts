/**
 * Currency conversion utilities using static exchange rates.
 *
 * Rates are approximate USD-to-X values (as of late 2024).
 * Used for pre-filling default prices when user's currency differs from USD.
 */

/**
 * Static exchange rates: 1 USD = X of target currency.
 * These are approximate and should be updated periodically.
 */
export const EXCHANGE_RATES_FROM_USD: Record<string, number> = {
  // Base
  USD: 1,

  // Major World Currencies
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CNY: 7.24,
  CHF: 0.88,

  // North America
  CAD: 1.36,
  MXN: 17.15,

  // Europe
  SEK: 10.42,
  NOK: 10.68,
  DKK: 6.87,
  PLN: 3.97,
  CZK: 22.85,
  HUF: 356.5,
  RON: 4.58,
  BGN: 1.8,
  HRK: 6.93,
  RUB: 92.5,
  UAH: 37.5,
  TRY: 32.5,
  ISK: 137.5,

  // Asia Pacific
  AUD: 1.53,
  NZD: 1.64,
  HKD: 7.82,
  SGD: 1.34,
  KRW: 1320,
  TWD: 31.5,
  INR: 83.2,
  IDR: 15650,
  MYR: 4.47,
  PHP: 55.8,
  THB: 35.2,
  VND: 24500,
  PKR: 278,
  BDT: 110,

  // Middle East
  AED: 3.67,
  SAR: 3.75,
  ILS: 3.72,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  JOD: 0.71,
  EGP: 30.9,

  // Africa
  ZAR: 18.7,
  NGN: 1550,
  KES: 153,
  GHS: 12.5,
  MAD: 10.05,

  // South America
  BRL: 4.97,
  ARS: 870,
  CLP: 880,
  COP: 3950,
  PEN: 3.72,

  // Caribbean
  JMD: 155,
  TTD: 6.78,
  BBD: 2.02,
};

/**
 * Convert a USD amount to the target currency.
 * Returns the converted amount, or the original if rate is unknown.
 *
 * @param amountUSD - Amount in USD
 * @param targetCurrency - Target currency code (e.g., 'EUR', 'GBP')
 * @returns Converted amount in target currency
 */
export function convertFromUSD(amountUSD: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES_FROM_USD[targetCurrency];

  if (rate === undefined) {
    // Unknown currency - return original USD amount
    console.warn(`[convertFromUSD] Unknown currency: ${targetCurrency}, using USD value`);
    return amountUSD;
  }

  const converted = amountUSD * rate;

  // Round to 2 decimal places for most currencies
  // For high-value currencies (JPY, KRW, etc.), round to whole numbers
  if (rate > 100) {
    return Math.round(converted);
  }

  return Math.round(converted * 100) / 100;
}

/**
 * Get the default price for a service in the user's currency.
 *
 * @param priceUSD - Default price in USD
 * @param userCurrency - User's preferred currency code
 * @returns Price in user's currency, or undefined if no price
 */
export function getDefaultPriceInCurrency(
  priceUSD: number | undefined,
  userCurrency: string
): number | undefined {
  if (priceUSD === undefined) {
    return undefined;
  }

  return convertFromUSD(priceUSD, userCurrency);
}
