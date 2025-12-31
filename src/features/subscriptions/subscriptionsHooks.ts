import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  deleteSubscription,
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
    onSuccess: async () => {
      // Delay invalidation to prevent Android crash from heavy re-render during navigation
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: subscriptionsKey(userId) }).catch((err) => {
          console.error('[subscriptions] invalidateQueries failed', err);
        });
      }, 500);
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
    onSuccess: async () => {
      // Delay invalidation to prevent Android crash
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: subscriptionsKey(userId) }).catch((err) => {
          console.error('[subscriptions] invalidateQueries failed', err);
        });
      }, 500);
    },
  });
}
