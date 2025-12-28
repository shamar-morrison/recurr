/**
 * React hooks for managing custom services using React Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CustomService, CustomServiceInput } from '@/src/constants/customServices';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { addCustomService, listCustomServices } from '@/src/features/services/customServicesRepo';

// Query key factory for custom services
export const customServicesKey = (userId: string | null | undefined) =>
  ['customServices', userId ?? 'anon'] as const;

/**
 * Hook to fetch custom services using React Query for caching.
 * Data is cached globally and shared across all components.
 */
export function useCustomServicesQuery() {
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  return useQuery({
    queryKey: customServicesKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      return listCustomServices(userId);
    },
  });
}

/**
 * Hook to add a new custom service.
 * Automatically invalidates the cache after successful creation.
 */
export function useAddCustomServiceMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.uid ?? '';

  return useMutation({
    mutationFn: async (input: CustomServiceInput) => {
      if (!userId) throw new Error('Not signed in');
      return addCustomService(userId, input);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: customServicesKey(userId) });
    },
  });
}

/**
 * Convenience hook that provides both the query and mutation.
 * Maintains backward compatibility with existing useCustomServices usage.
 */
export function useCustomServices() {
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  const query = useQuery({
    queryKey: customServicesKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      return listCustomServices(userId);
    },
  });

  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (input: CustomServiceInput) => {
      if (!userId) throw new Error('Not signed in');
      return addCustomService(userId, input);
    },
    onSuccess: async (newService) => {
      // Optimistically update the cache with the new service
      qc.setQueryData<CustomService[]>(customServicesKey(userId), (old) => {
        if (!old) return [newService];
        return [newService, ...old].sort((a, b) => a.name.localeCompare(b.name));
      });
    },
  });

  // Wrapper function for backward compatibility
  const addService = async (input: CustomServiceInput): Promise<CustomService | null> => {
    try {
      const result = await addMutation.mutateAsync(input);
      return result;
    } catch (e) {
      console.log('[useCustomServices] addService failed', e);
      throw e; // Re-throw so caller can handle
    }
  };

  return {
    customServices: query.data ?? [],
    isLoading: query.isLoading,
    addService,
    refreshServices: () => qc.invalidateQueries({ queryKey: customServicesKey(userId) }),
  };
}
