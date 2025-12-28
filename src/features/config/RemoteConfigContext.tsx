import { remoteConfig } from '@/src/lib/firebase';
import { fetchAndActivate, getNumber } from 'firebase/remote-config';
import React, { createContext, ReactNode, useEffect, useMemo, useState } from 'react';

export interface RemoteConfigState {
  freeTierLimit: number;
  loading: boolean;
  error: Error | null;
}

export const RemoteConfigContext = createContext<RemoteConfigState | null>(null);

interface RemoteConfigProviderProps {
  children: ReactNode;
}

export function RemoteConfigProvider({ children }: RemoteConfigProviderProps) {
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
        console.log('[RemoteConfigProvider] fetch failed', e);
        setError(e instanceof Error ? e : new Error(String(e)));
        // Fallback or stick with existing default
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const value = useMemo(() => ({ freeTierLimit, loading, error }), [freeTierLimit, loading, error]);

  return <RemoteConfigContext.Provider value={value}>{children}</RemoteConfigContext.Provider>;
}
