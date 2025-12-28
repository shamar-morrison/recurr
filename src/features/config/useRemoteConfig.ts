import { remoteConfig } from '@/src/lib/firebase';
import { fetchAndActivate, getNumber } from 'firebase/remote-config';
import { useEffect, useState } from 'react';

export function useRemoteConfig() {
  const [freeTierLimit, setFreeTierLimit] = useState(getNumber(remoteConfig, 'FREE_TIER_LIMIT'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch and activate to ensure we have the latest values from the server
    fetchAndActivate(remoteConfig)
      .then(() => {
        setFreeTierLimit(getNumber(remoteConfig, 'FREE_TIER_LIMIT'));
      })
      .catch((e) => {
        console.log('[useRemoteConfig] fetch failed', e);
        setError(e instanceof Error ? e : new Error(String(e)));
        // Fallback or stick with existing default
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { freeTierLimit, loading, error };
}
