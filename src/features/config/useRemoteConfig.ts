import { remoteConfig } from '@/src/lib/firebase';
import { fetchAndActivate, getNumber } from 'firebase/remote-config';
import { useEffect, useState } from 'react';

export function useRemoteConfig() {
  const [freeTierLimit, setFreeTierLimit] = useState(getNumber(remoteConfig, 'FREE_TIER_LIMIT'));

  useEffect(() => {
    // Fetch and activate to ensure we have the latest values from the server
    fetchAndActivate(remoteConfig)
      .then(() => {
        setFreeTierLimit(getNumber(remoteConfig, 'FREE_TIER_LIMIT'));
      })
      .catch((e) => {
        console.log('[useRemoteConfig] fetch failed', e);
        // Fallback or stick with existing default
      });
  }, []);

  return { freeTierLimit };
}
