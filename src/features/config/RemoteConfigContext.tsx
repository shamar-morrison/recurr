import React, { createContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { fetchRemoteConfig } from './remoteConfigService';

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
  const [freeTierLimit, setFreeTierLimit] = useState(5); // Default fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('[RemoteConfigProvider] Fetching config...');

    fetchRemoteConfig()
      .then((config) => {
        console.log('[RemoteConfigProvider] Got config:', config);
        setFreeTierLimit(config.FREE_TIER_LIMIT);
      })
      .catch((e) => {
        console.log('[RemoteConfigProvider] fetch failed', e);
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const value = useMemo(() => ({ freeTierLimit, loading, error }), [freeTierLimit, loading, error]);

  return <RemoteConfigContext.Provider value={value}>{children}</RemoteConfigContext.Provider>;
}
