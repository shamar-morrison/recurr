import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LOGO_DEV_TOKEN = process.env.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY;

/** AsyncStorage key for the persisted logo cache */
const STORAGE_KEY = 'logo_cache_v1';

/** 30 days in milliseconds */
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Timeout for logo validation requests (in ms) */
const FETCH_TIMEOUT_MS = 3000;

// ─────────────────────────────────────────────────────────────────────────────
// CACHE TYPES
// ─────────────────────────────────────────────────────────────────────────────

type CacheEntry = {
  /** The validated logo URL, or null if invalid */
  url: string | null;
  /** Timestamp when this entry was cached */
  cachedAt: number;
};

type CacheData = Record<string, CacheEntry>;

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY CACHE (Layer 1)
// ─────────────────────────────────────────────────────────────────────────────

/** In-memory cache for instant access during the session */
const memoryCache = new Map<string, CacheEntry>();

/** Flag to track if we've loaded from AsyncStorage yet */
let isStorageLoaded = false;

/** Promise that resolves when storage is loaded (prevents race conditions) */
let storageLoadPromise: Promise<void> | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load the cache from AsyncStorage into memory.
 * Called once on first hook usage.
 */
async function loadCacheFromStorage(): Promise<void> {
  if (isStorageLoaded) return;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: CacheData = JSON.parse(raw);
      const now = Date.now();

      // Hydrate memory cache, filtering out expired entries
      for (const [domain, entry] of Object.entries(data)) {
        if (now - entry.cachedAt < THIRTY_DAYS_MS) {
          memoryCache.set(domain, entry);
        }
      }
    }
  } catch (error) {
    // Storage read failed - continue with empty cache
    console.warn('[useServiceLogo] Failed to load cache from storage:', error);
  }

  isStorageLoaded = true;
}

/**
 * Persist the current memory cache to AsyncStorage.
 * Called after each new domain resolution.
 */
async function saveCacheToStorage(): Promise<void> {
  try {
    const data: CacheData = {};
    for (const [domain, entry] of memoryCache.entries()) {
      data[domain] = entry;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Storage write failed - cache is still in memory, will retry next time
    console.warn('[useServiceLogo] Failed to save cache to storage:', error);
  }
}

/**
 * Ensure storage is loaded before proceeding.
 * Uses a shared promise to prevent duplicate loads.
 */
async function ensureStorageLoaded(): Promise<void> {
  if (isStorageLoaded) return;

  if (!storageLoadPromise) {
    storageLoadPromise = loadCacheFromStorage();
  }

  await storageLoadPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGO VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates the logo.dev URL for a given domain.
 */
export function getLogoUrl(domain: string): string {
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}`;
}

/**
 * Validates whether a logo URL returns a valid image.
 * Uses GET with a timeout (HEAD is unreliable on mobile).
 */
async function validateLogoUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    // Network error, timeout, or abort
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Resolve a logo URL for a domain.
 * Checks cache first, then validates with logo.dev if needed.
 */
async function resolveLogo(domain: string): Promise<string | null> {
  // Ensure storage is loaded
  await ensureStorageLoaded();

  const now = Date.now();

  // Check memory cache first
  const cached = memoryCache.get(domain);
  if (cached && now - cached.cachedAt < THIRTY_DAYS_MS) {
    // Cache hit - return immediately (even if null)
    return cached.url;
  }

  // Cache miss or expired - validate with logo.dev
  const url = getLogoUrl(domain);
  const isValid = await validateLogoUrl(url);
  const result = isValid ? url : null;

  // Store in cache
  const entry: CacheEntry = { url: result, cachedAt: now };
  memoryCache.set(domain, entry);

  // Persist to AsyncStorage (fire-and-forget)
  saveCacheToStorage();

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

type UseServiceLogoResult = {
  logoUrl: string | null;
  isLoading: boolean;
  isError: boolean;
};

/**
 * Hook to fetch and validate a service logo from logo.dev.
 * Returns the logo URL if valid, null otherwise.
 *
 * Features:
 * - Two-layer cache (in-memory + AsyncStorage)
 * - 30-day TTL on cached entries
 * - GET request with 3s timeout for validation
 * - Each domain hits logo.dev at most once per 30 days
 */
export function useServiceLogo(domain?: string): UseServiceLogoResult {
  const queryClient = useQueryClient();

  // Pre-populate React Query cache from our persistent cache on mount
  useEffect(() => {
    if (!domain || !LOGO_DEV_TOKEN) return;

    ensureStorageLoaded().then(() => {
      const cached = memoryCache.get(domain);
      const now = Date.now();

      if (cached && now - cached.cachedAt < THIRTY_DAYS_MS) {
        // Seed React Query cache with our persisted value
        queryClient.setQueryData(['service-logo', domain], cached.url);
      }
    });
  }, [domain, queryClient]);

  const query = useQuery({
    queryKey: ['service-logo', domain],
    queryFn: async () => {
      if (!domain || !LOGO_DEV_TOKEN) {
        return null;
      }
      return resolveLogo(domain);
    },
    enabled: Boolean(domain && LOGO_DEV_TOKEN),
    staleTime: THIRTY_DAYS_MS,
    gcTime: THIRTY_DAYS_MS,
    retry: false,
  });

  return {
    logoUrl: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
