import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  upsertSubscription,
} from '@/src/features/subscriptions/subscriptionsRepo';
import { toListItem } from '@/src/features/subscriptions/subscriptionsUtils';
import {
  Subscription,
  SubscriptionInput,
  SubscriptionListItem,
} from '@/src/features/subscriptions/types';

export const subscriptionsKey = (userId: string | null | undefined) =>
  ['subscriptions', userId ?? 'anon'] as const;

export function useSubscriptionsQuery() {
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  return useQuery({
    queryKey: subscriptionsKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      return listSubscriptions(userId);
    },
  });
}

export function useSubscriptionQuery(subscriptionId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.uid ?? '';
  const qc = useQueryClient();

  return useQuery({
    queryKey: ['subscription', userId, subscriptionId],
    enabled: Boolean(userId && subscriptionId),
    queryFn: () => getSubscription(userId, subscriptionId!),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: () => {
      const list = qc.getQueryData<Subscription[]>(subscriptionsKey(userId));
      return list?.find((s) => s.id === subscriptionId);
    },
  });
}

export function useSubscriptionListItems(subs: Subscription[] | undefined): SubscriptionListItem[] {
  return useMemo(() => {
    const list = subs ?? [];
    const now = new Date();
    return list
      .filter((s) => !s.isArchived)
      .map((s) => toListItem(s, now))
      .sort((a, b) => a.nextBillingInDays - b.nextBillingInDays);
  }, [subs]);
}

export function useUpsertSubscriptionMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.uid ?? '';

  return useMutation({
    mutationFn: async (input: SubscriptionInput) => {
      if (!userId) throw new Error('Not signed in');
      return upsertSubscription(userId, input);
    },
    onSuccess: (savedSub) => {
      // Optimistically update list without refetching
      qc.setQueryData<Subscription[]>(subscriptionsKey(userId), (old) => {
        const list = old ? [...old] : [];
        const index = list.findIndex((s) => s.id === savedSub.id);
        if (index >= 0) {
          list[index] = savedSub;
        } else {
          list.unshift(savedSub);
        }
        // Maintain sort order (updatedAt desc would be ideal, or just let next fetch clean up)
        return list;
      });

      // Update single doc cache
      qc.setQueryData(['subscription', userId, savedSub.id], savedSub);
    },
  });
}

export function useDeleteSubscriptionMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.uid ?? '';

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Not signed in');
      await deleteSubscription(userId, id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Optimistically remove from list
      qc.setQueryData<Subscription[]>(subscriptionsKey(userId), (old) => {
        return (old ?? []).filter((s) => s.id !== deletedId);
      });

      // Clear single doc cache
      qc.removeQueries({ queryKey: ['subscription', userId, deletedId] });
    },
  });
}
