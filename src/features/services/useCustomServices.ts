/**
 * React hook for managing custom services.
 */

import { useCallback, useEffect, useState } from 'react';

import { CustomService, CustomServiceInput } from '@/src/constants/customServices';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { addCustomService, listCustomServices } from '@/src/features/services/customServicesRepo';

export function useCustomServices() {
  const { user, isReady } = useAuth();
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshServices = useCallback(async () => {
    if (!user?.uid) {
      setCustomServices([]);
      setIsLoading(false);
      return;
    }

    try {
      const services = await listCustomServices(user.uid);
      setCustomServices(services);
    } catch (e) {
      console.log('[useCustomServices] refreshServices failed', e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (isReady) {
      refreshServices();
    }
  }, [isReady, refreshServices]);

  const addService = useCallback(
    async (input: CustomServiceInput): Promise<CustomService | null> => {
      if (!user?.uid) return null;

      try {
        const newService = await addCustomService(user.uid, input);
        setCustomServices((prev) =>
          [newService, ...prev].sort((a, b) => a.name.localeCompare(b.name))
        );
        return newService;
      } catch (e) {
        console.log('[useCustomServices] addService failed', e);
        return null;
      }
    },
    [user?.uid]
  );

  return {
    customServices,
    isLoading,
    addService,
    refreshServices,
  };
}
