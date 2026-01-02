import { firestore } from '@/src/lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';

const CONFIG_CACHE_KEY = '@recurr/app_config_cache';
const CACHE_TTL_MS = __DEV__ ? 0 : 1000 * 60 * 60; // 0 in dev, 1 hour in prod

interface AppConfigCache {
  values: Record<string, unknown>;
  fetchedAt: number;
}

interface AppConfig {
  FREE_TIER_LIMIT: number;
}

const DEFAULTS: AppConfig = {
  FREE_TIER_LIMIT: 5,
};

/**
 * Fetches app config from Firestore document `config/app`.
 * Falls back to cached values if fetch fails, or defaults if no cache.
 */
export async function fetchRemoteConfig(): Promise<AppConfig> {
  // Check cache first
  try {
    const cached = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) {
      const parsed: AppConfigCache = JSON.parse(cached);
      const age = Date.now() - parsed.fetchedAt;

      if (age < CACHE_TTL_MS) {
        console.log('[configService] Using cached values (age:', Math.round(age / 1000), 's)');
        return {
          FREE_TIER_LIMIT:
            typeof parsed.values.FREE_TIER_LIMIT === 'number'
              ? parsed.values.FREE_TIER_LIMIT
              : DEFAULTS.FREE_TIER_LIMIT,
        };
      }
    }
  } catch (e) {
    console.log('[configService] Cache read failed:', e);
  }

  // Fetch from Firestore
  try {
    console.log('[configService] Fetching from Firestore...');
    const configRef = doc(firestore, 'config', 'app');
    const snapshot = await getDoc(configRef);

    if (!snapshot.exists()) {
      console.log('[configService] No config document found, using defaults');
      return DEFAULTS;
    }

    const data = snapshot.data();
    console.log('[configService] Got config:', data);

    // Cache the result
    const cache: AppConfigCache = {
      values: data,
      fetchedAt: Date.now(),
    };
    await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cache));

    return {
      FREE_TIER_LIMIT:
        typeof data.FREE_TIER_LIMIT === 'number' ? data.FREE_TIER_LIMIT : DEFAULTS.FREE_TIER_LIMIT,
    };
  } catch (e) {
    console.log('[configService] Firestore fetch failed:', e);

    // Try to use stale cache if available
    try {
      const cached = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
      if (cached) {
        const parsed: AppConfigCache = JSON.parse(cached);
        console.log('[configService] Using stale cache as fallback');
        return {
          FREE_TIER_LIMIT:
            typeof parsed.values.FREE_TIER_LIMIT === 'number'
              ? parsed.values.FREE_TIER_LIMIT
              : DEFAULTS.FREE_TIER_LIMIT,
        };
      }
    } catch (cacheErr) {
      console.log('[configService] Stale cache read failed:', cacheErr);
    }

    return DEFAULTS;
  }
}

/**
 * Clears the config cache. Useful for testing.
 */
export async function clearConfigCache(): Promise<void> {
  await AsyncStorage.removeItem(CONFIG_CACHE_KEY);
  console.log('[configService] Cache cleared');
}
