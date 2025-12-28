/**
 * React hooks for managing custom services using React Query + real-time Firestore listeners.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { CustomService, CustomServiceInput } from '@/src/constants/customServices';
import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  addCustomService,
  listCustomServices,
  subscribeToCustomServices,
} from '@/src/features/services/customServicesRepo';

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
 * Uses a real-time Firestore listener to keep data fresh.
 * Data is pushed into React Query's cache so it's instantly available on navigation.
 */
export function useCustomServices() {
  const { user } = useAuth();
  const userId = user?.uid ?? '';
  const qc = useQueryClient();

  // Set up real-time listener that pushes data into React Query cache
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToCustomServices(
      userId,
      (services) => {
        // Push real-time data into React Query cache
        qc.setQueryData<CustomService[]>(customServicesKey(userId), services);
      },
      (error) => {
        console.log('[useCustomServices] subscription error', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, qc]);

  // React Query still manages the cache, but data comes from the listener
  const query = useQuery({
    queryKey: customServicesKey(userId),
    enabled: Boolean(userId),
    // Use staleTime: Infinity since listener keeps data fresh
    staleTime: Infinity,
    // Initial fetch only runs if cache is empty (listener will update after)
    queryFn: async () => {
      return listCustomServices(userId);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (input: CustomServiceInput) => {
      if (!userId) throw new Error('Not signed in');
      return addCustomService(userId, input);
    },
    onSuccess: async (newService) => {
      // Optimistically update the cache with the new service
      // (The real-time listener will also push the update, but this makes it instant)
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
