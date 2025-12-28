import { useContext } from 'react';
import { RemoteConfigContext, RemoteConfigState } from './RemoteConfigContext';

export function useRemoteConfig(): RemoteConfigState {
  const context = useContext(RemoteConfigContext);
  if (context === null) {
    throw new Error('useRemoteConfig must be used within a RemoteConfigProvider');
  }
  return context;
}
