import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  addCustomCategory,
  CustomCategory,
  deleteCustomCategory,
  listCustomCategories,
} from '@/src/features/subscriptions/categoriesRepo';
import { DEFAULT_CATEGORIES, SubscriptionCategory } from '@/src/features/subscriptions/types';

/**
 * Hook to fetch and manage custom categories.
 * Returns all categories (default + custom) combined.
 */
export function useCategories() {
  const { user } = useAuth();
  const userId = user?.uid ?? '';
  const queryClient = useQueryClient();

  const customCategoriesQuery = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => listCustomCategories(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => addCustomCategory(userId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => deleteCustomCategory(userId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
  });

  const customCategories = customCategoriesQuery.data ?? [];

  // Combine default + custom categories
  const allCategories: SubscriptionCategory[] = useMemo(() => {
    const custom = customCategories.map((c: CustomCategory) => c.name);
    return [...DEFAULT_CATEGORIES, ...custom];
  }, [customCategories]);

  return {
    allCategories,
    customCategories,
    isLoading: customCategoriesQuery.isLoading,
    addCategory: addMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}
