/**
 * Currency conversion utilities using dynamic exchange rates.
 *
 * Rates are fetched from fawazahmed0/exchange-api and cached locally.
 * Falls back to static rates if fetch fails or cache is unavailable.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@currency_rates';
const CACHE_TIMESTAMP_KEY = '@currency_rates_timestamp';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Static exchange rates: 1 USD = X of target currency.
 * These are approximate fallback values (as of late 2024).
 */
const STATIC_RATES_FROM_USD: Record<string, number> = {
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

// In-memory rates, updated by initCurrencyRates
let liveRates: Record<string, number> | null = null;

interface ExchangeApiResponse {
  date: string;
  usd: Record<string, number>;
}

// API URLs for exchange rates - pinned to specific snapshot for production stability
const EXCHANGE_API_PRIMARY_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
const EXCHANGE_API_FALLBACK_URL = 'https://currency-api.pages.dev/v1/currencies/usd.json';

/**
 * Fetch latest rates from the exchange API.
 * Tries the primary jsDelivr URL first, then falls back to Cloudflare Pages.
 */
async function fetchRates(): Promise<Record<string, number> | null> {
  const FETCH_TIMEOUT_MS = 10000; // 10 seconds

  /**
   * Attempt to fetch rates from a given URL with timeout.
   */
  async function tryFetch(url: string): Promise<Record<string, number> | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('[currencyConversion] API response not OK:', response.status, 'from', url);
        return null;
      }

      const data: ExchangeApiResponse = await response.json();
      // The API returns rates as { usd: { eur: 0.92, gbp: 0.79, ... } }
      // We need to convert keys to uppercase for consistency
      const rates: Record<string, number> = { USD: 1 };
      for (const [currency, rate] of Object.entries(data.usd)) {
        rates[currency.toUpperCase()] = rate;
      }
      return rates;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('[currencyConversion] Fetch failed from', url, ':', error);
      return null;
    }
  }

  console.log('[currencyConversion] Fetching rates from primary API...');
  let rates = await tryFetch(EXCHANGE_API_PRIMARY_URL);

  if (!rates) {
    console.log('[currencyConversion] Primary API failed, trying fallback...');
    rates = await tryFetch(EXCHANGE_API_FALLBACK_URL);
  }

  if (rates) {
    console.log('[currencyConversion] Fetched rates for', Object.keys(rates).length, 'currencies');
  } else {
    console.warn('[currencyConversion] All API sources failed');
  }

  return rates;
}

/**
 * Save rates to AsyncStorage with current timestamp.
 */
async function cacheRates(rates: Record<string, number>): Promise<void> {
  try {
    // Use multiSet for atomic writes to prevent inconsistent state
    await AsyncStorage.multiSet([
      [CACHE_KEY, JSON.stringify(rates)],
      [CACHE_TIMESTAMP_KEY, String(Date.now())],
    ]);
    console.log('[currencyConversion] Rates cached to AsyncStorage');
  } catch (error) {
    console.warn('[currencyConversion] Failed to cache rates:', error);
  }
}

/**
 * Load cached rates from AsyncStorage if valid.
 */
async function loadCachedRates(): Promise<Record<string, number> | null> {
  try {
    // Use multiGet for atomic reads to prevent inconsistent state
    const results = await AsyncStorage.multiGet([CACHE_TIMESTAMP_KEY, CACHE_KEY]);
    const timestampStr = results[0][1];
    const ratesStr = results[1][1];

    if (!timestampStr || !ratesStr) return null;

    const timestamp = Number(timestampStr);
    const age = Date.now() - timestamp;
    if (age > CACHE_DURATION_MS) {
      console.log('[currencyConversion] Cache expired, age:', Math.round(age / 3600000), 'hours');
      return null;
    }

    const rates = JSON.parse(ratesStr) as Record<string, number>;
    console.log(
      '[currencyConversion] Loaded cached rates, age:',
      Math.round(age / 3600000),
      'hours'
    );
    return rates;
  } catch (error) {
    console.warn('[currencyConversion] Failed to load cached rates:', error);
    return null;
  }
}

/**
 * Initialize currency rates. Call this early in app startup.
 * Loads from cache if valid, otherwise fetches from API.
 */
export async function initCurrencyRates(): Promise<void> {
  // Try loading from cache first
  const cached = await loadCachedRates();
  if (cached) {
    liveRates = cached;
    return;
  }

  // Cache miss or expired, fetch from API
  const fetched = await fetchRates();
  if (fetched) {
    liveRates = fetched;
    await cacheRates(fetched);
  } else {
    console.log('[currencyConversion] Using static fallback rates');
    // Keep liveRates as null, convertFromUSD will use static rates
  }
}

/**
 * Get the current exchange rate for a currency.
 * Uses live rates if available, otherwise static rates.
 */
function getRate(currencyCode: string): number | undefined {
  const code = currencyCode.toUpperCase();
  if (liveRates && liveRates[code] !== undefined) {
    return liveRates[code];
  }
  return STATIC_RATES_FROM_USD[code];
}

/**
 * Convert a USD amount to the target currency.
 * Returns the converted amount, or the original if rate is unknown.
 *
 * @param amountUSD - Amount in USD
 * @param targetCurrency - Target currency code (e.g., 'EUR', 'GBP')
 * @returns Converted amount in target currency
 */
export function convertFromUSD(amountUSD: number, targetCurrency: string): number {
  const rate = getRate(targetCurrency);

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

// Re-export static rates for backwards compatibility (if needed elsewhere)
export const EXCHANGE_RATES_FROM_USD = STATIC_RATES_FROM_USD;
