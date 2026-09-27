import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  retryPendingSyncs,
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
  const qc = useQueryClient();

  return useQuery({
    queryKey: subscriptionsKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const subs = await listSubscriptions(userId);
      // Flush any offline writes still flagged pendingSync. Fire-and-forget:
      // the returned list already holds the newer local data, and rows that
      // fail again stay flagged for the next fetch. Once resolved, patch the
      // cache so synced rows (new id, cleared pendingSync) show up without
      // waiting for the next full refetch.
      void retryPendingSyncs(userId, subs).then((results) => {
        if (results.length === 0) return;
        qc.setQueryData<Subscription[]>(subscriptionsKey(userId), (old) => {
          if (!old) return old;
          let list = old;
          for (const { originalId, subscription } of results) {
            list = list.filter((s) => s.id !== originalId && s.id !== subscription.id);
            list = [subscription, ...list];
          }
          return list;
        });
        for (const { subscription } of results) {
          qc.setQueryData(['subscription', userId, subscription.id], subscription);
        }
      });
      return subs;
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
      .filter((s) => s.status !== 'Archived')
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
    onSuccess: (savedSub, input) => {
      // Optimistically update list without refetching.
      // Filter on BOTH the mutation input id and the saved id: on the first
      // sync of an offline-created row the cache still holds the old local_
      // id while savedSub.id is the new Firestore id — matching only the
      // saved id would unshift a duplicate. (input.id may be undefined for
      // brand-new rows; `s.id !== undefined` is then trivially true.)
      qc.setQueryData<Subscription[]>(subscriptionsKey(userId), (old) => {
        // Never fetched: leave the query untouched (it will fetch normally
        // on mount) instead of seeding a synthetic one-row list that could
        // sit until staleTime expires.
        if (!old) return undefined;
        const list = old.filter(
          (s) => s.id !== input.id && s.id !== savedSub.id
        );
        list.unshift(savedSub);
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
