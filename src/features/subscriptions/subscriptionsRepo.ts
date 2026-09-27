import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { Subscription, SubscriptionInput } from '@/src/features/subscriptions/types';
import { firestore, isFirebaseConfigured } from '@/src/lib/firebase';

const STORAGE_KEY_PREFIX = 'subscriptions:v1:';

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function nowMillis() {
  return Date.now();
}

function normalizeSubscription(raw: unknown): Subscription | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Subscription> & { id?: unknown };

  if (typeof r.id !== 'string') return null;
  if (typeof r.userId !== 'string') return null;
  if (typeof r.serviceName !== 'string') return null;
  if (typeof r.category !== 'string') return null;
  if (typeof r.amount !== 'number') return null;
  if (typeof r.currency !== 'string') return null;
  if (typeof r.billingCycle !== 'string') return null;
  if (typeof r.billingDay !== 'number') return null;

  return {
    id: r.id,
    userId: r.userId,
    serviceName: r.serviceName,
    category: r.category as Subscription['category'],
    amount: r.amount,
    currency: r.currency,
    billingCycle: r.billingCycle as Subscription['billingCycle'],
    billingDay: r.billingDay,
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    startDate: typeof r.startDate === 'number' ? r.startDate : undefined,
    endDate: typeof r.endDate === 'number' ? r.endDate : undefined,
    paymentMethod:
      typeof r.paymentMethod === 'string'
        ? (r.paymentMethod as Subscription['paymentMethod'])
        : undefined,
    isArchived: Boolean(r.isArchived),
    status: (r.status as Subscription['status']) ?? (r.isArchived ? 'Archived' : 'Active'),
    reminderDays: typeof r.reminderDays === 'number' ? r.reminderDays : null,
    reminderHour: typeof r.reminderHour === 'number' ? r.reminderHour : null,
    notificationId: typeof r.notificationId === 'string' ? r.notificationId : null,
    snoozedUntil: typeof r.snoozedUntil === 'number' ? r.snoozedUntil : null,
    // Local-only flag (AsyncStorage cache). Never trust a remote value for this.
    pendingSync: r.pendingSync === true ? true : undefined,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : nowMillis(),
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : nowMillis(),
  };
}

async function readLocal(userId: string): Promise<Subscription[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: Subscription[] = [];
    for (const item of parsed) {
      const normalized = normalizeSubscription(item);
      if (normalized) out.push(normalized);
    }
    return out;
  } catch (e) {
    console.log('[subscriptions] readLocal failed', e);
    return [];
  }
}

async function writeLocal(userId: string, subs: Subscription[]): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(subs));
  } catch (e) {
    console.log('[subscriptions] writeLocal failed', e);
  }
}

function mapDocToSubscription(
  id: string,
  userId: string,
  data: Record<string, unknown>
): Subscription {
  return {
    id,
    userId,
    serviceName: String(data.serviceName ?? ''),
    category: String(data.category ?? 'Other') as Subscription['category'],
    amount: typeof data.amount === 'number' ? data.amount : 0,
    currency: String(data.currency ?? 'USD'),
    billingCycle: String(data.billingCycle ?? 'Monthly') as Subscription['billingCycle'],
    billingDay: typeof data.billingDay === 'number' ? data.billingDay : 1,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    startDate: typeof data.startDate === 'number' ? data.startDate : undefined,
    endDate: typeof data.endDate === 'number' ? data.endDate : undefined,
    paymentMethod:
      typeof data.paymentMethod === 'string'
        ? (data.paymentMethod as Subscription['paymentMethod'])
        : undefined,
    isArchived: Boolean(data.isArchived),
    status: (data.status as Subscription['status']) ?? (data.isArchived ? 'Archived' : 'Active'),
    reminderDays: typeof data.reminderDays === 'number' ? data.reminderDays : null,
    reminderHour: typeof data.reminderHour === 'number' ? data.reminderHour : null,
    notificationId: typeof data.notificationId === 'string' ? data.notificationId : null,
    snoozedUntil: typeof data.snoozedUntil === 'number' ? data.snoozedUntil : null,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : nowMillis(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : nowMillis(),
  };
}

export async function listSubscriptions(userId: string): Promise<Subscription[]> {
  if (!userId) return [];

  if (!isFirebaseConfigured()) {
    console.log('[subscriptions] Firebase not configured; using local store');
    const local = await readLocal(userId);
    return local
      .filter((s) => !s.isArchived)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }

  try {
    console.log('[subscriptions] listSubscriptions from Firestore', { userId });
    const subsCol = collection(firestore, 'users', userId, 'subscriptions');

    const q = query(
      subsCol,
      where('isArchived', '!=', true),
      orderBy('isArchived'),
      orderBy('updatedAt', 'desc')
    );

    const snap = await getDocs(q);
    const out: Subscription[] = snap.docs.map((d) =>
      mapDocToSubscription(d.id, userId, d.data() as Record<string, unknown>)
    );

    // Don't clobber locally-newer rows whose Firestore write is still pending:
    // the server snapshot is stale for these, so keep the local version.
    const localBefore = await readLocal(userId);
    const pendingById = new Map(
      localBefore.filter((s) => s.pendingSync === true).map((s) => [s.id, s] as const)
    );
    const merged = out.map((s) => pendingById.get(s.id) ?? s);
    for (const pending of pendingById.values()) {
      if (!merged.some((s) => s.id === pending.id)) {
        merged.push(pending);
      }
    }
    merged.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    await writeLocal(userId, merged);

    return merged;
  } catch (e) {
    console.log('[subscriptions] listSubscriptions Firestore failed -> fallback local', e);
    const local = await readLocal(userId);
    return local
      .filter((s) => !s.isArchived)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }
}

export async function getSubscription(
  userId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  if (!userId || !subscriptionId) return null;

  if (!isFirebaseConfigured()) {
    const local = await readLocal(userId);
    return local.find((s) => s.id === subscriptionId) ?? null;
  }

  try {
    const d = await getDoc(doc(firestore, 'users', userId, 'subscriptions', subscriptionId));
    if (!d.exists()) {
      // No remote doc — may be an offline-created local_ row not yet synced.
      const localOnly = await readLocal(userId);
      return localOnly.find((s) => s.id === subscriptionId) ?? null;
    }

    const remote = mapDocToSubscription(d.id, userId, d.data() as Record<string, unknown>);
    // Prefer a locally-pending (newer, unsynced) version over stale server data.
    const local = await readLocal(userId);
    const pending = local.find((s) => s.id === subscriptionId && s.pendingSync === true);
    return pending ?? remote;
  } catch (e) {
    console.log('[subscriptions] getSubscription failed', e);
    // Fallback to local
    const local = await readLocal(userId);
    return local.find((s) => s.id === subscriptionId) ?? null;
  }
}

/**
 * Re-key notifications after a local_ row is assigned its real Firestore id.
 *
 * A reminder scheduled while the row was still local_ carries
 * data.subscriptionId = "local_xxx". After sync that id is dead: tray
 * actions on it would resolve to the ghost cache row and write a duplicate
 * remote doc. So, only on an actual local_ -> real-id transition, schedule
 * a replacement under the real id (snooze variant when a snooze is active,
 * regular reminder otherwise), cancel the dead-id notification afterwards
 * (schedule-before-cancel, so a failure leaves the original intact), and
 * fix up the just-created remote doc with the new notificationId.
 *
 * Returns the row to persist locally. Never throws — on any failure the
 * input `saved` is returned unchanged (ghost row is still dropped by the
 * caller, so a dead-id lookup cleanly misses afterwards).
 *
 * NOTE: dynamic import to avoid a module cycle (notificationService imports
 * this repo). Resolved at call time, when both modules are initialized.
 */
async function rekeySyncedRowNotifications(
  userId: string,
  realId: string,
  localSub: Subscription,
  saved: Subscription
): Promise<Subscription> {
  const hasLiveRef = (localSub.notificationId ?? null) !== null;
  const snoozeActive =
    typeof localSub.snoozedUntil === 'number' && localSub.snoozedUntil > Date.now();
  if (!hasLiveRef && !snoozeActive) return saved;

  const {
    cancelNotification,
    scheduleSubscriptionReminder,
    snoozeSubscriptionReminderUntil,
  } = await import('@/src/features/notifications/notificationService');

  let notificationId: string | null = null;
  if (snoozeActive && typeof localSub.snoozedUntil === 'number') {
    const res = await snoozeSubscriptionReminderUntil(
      { ...saved, notificationId: null },
      localSub.snoozedUntil
    );
    notificationId = res.notificationId;
  } else if (typeof saved.reminderDays === 'number' && saved.reminderDays > 0) {
    notificationId = await scheduleSubscriptionReminder(
      { ...saved, notificationId: null },
      saved.reminderDays,
      saved.reminderHour ?? 12
    );
  } else {
    return saved;
  }

  if (!notificationId) {
    console.log('[subscriptions] rekey reschedule failed; keeping synced row as-is', {
      id: realId,
    });
    return saved;
  }

  if (localSub.notificationId) {
    await cancelNotification(localSub.notificationId);
  }

  // The remote doc was just created with the dead id — patch it in the same
  // upsert. If this patch fails, flag pending so a later sweep heals it.
  const now = nowMillis();
  try {
    await setDoc(
      doc(firestore, 'users', userId, 'subscriptions', realId),
      { notificationId, updatedAt: now },
      { merge: true }
    );
  } catch (e) {
    console.log('[subscriptions] rekey remote fix-up failed (pendingSync)', e);
    return { ...saved, notificationId, updatedAt: now, pendingSync: true };
  }
  return { ...saved, notificationId, updatedAt: now };
}

export async function upsertSubscription(
  userId: string,
  input: SubscriptionInput
): Promise<Subscription> {
  const now = nowMillis();
  const local = await readLocal(userId);
  let existing = local.find((s) => s.id === input.id);
  let existingCreatedAt = existing?.createdAt;

  // Fallback: If not in local but is an existing remote ID, fetch from Firestore to preserve createdAt
  if (!existingCreatedAt && input.id && !input.id.startsWith('local_') && isFirebaseConfigured()) {
    try {
      const snap = await getDoc(doc(firestore, 'users', userId, 'subscriptions', input.id));
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.createdAt === 'number') {
          existingCreatedAt = data.createdAt;
        }
      }
    } catch (e) {
      console.log('[subscriptions] failed to fetch existing createdAt', e);
    }
  }

  const sub: Subscription = {
    id: input.id ?? `local_${now}_${Math.random().toString(16).slice(2)}`,
    userId,
    serviceName: input.serviceName,
    category: input.category,
    amount: input.amount,
    currency: input.currency,
    billingCycle: input.billingCycle,
    billingDay: input.billingDay,
    notes: input.notes,
    startDate: input.startDate,
    endDate: input.endDate,
    paymentMethod: input.paymentMethod,
    isArchived: Boolean(input.isArchived),
    status: input.status ?? (input.isArchived ? 'Archived' : 'Active'),
    reminderDays: input.reminderDays ?? null,
    reminderHour: input.reminderHour ?? null,
    notificationId: input.notificationId ?? null,
    snoozedUntil: input.snoozedUntil ?? null,
    // Optimistic: cleared below on Firestore success, set on Firestore failure.
    // Never sent to Firestore (see payloads below).
    pendingSync: undefined,
    createdAt: (input as Partial<Subscription>).createdAt ?? existingCreatedAt ?? now,
    updatedAt: now,
  };

  const nextLocal = mergeLocal(local, sub);
  await writeLocal(userId, nextLocal);

  if (!isFirebaseConfigured()) {
    console.log('[subscriptions] upsertSubscription local-only', { userId, id: sub.id });
    return sub;
  }

  try {
    console.log('[subscriptions] upsertSubscription Firestore', { userId, id: sub.id });
    const isLocal = sub.id.startsWith('local_');

    if (isLocal) {
      const subsCol = collection(firestore, 'users', userId, 'subscriptions');
      const docRef = await addDoc(subsCol, {
        serviceName: sub.serviceName,
        category: sub.category,
        amount: sub.amount,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        billingDay: sub.billingDay,
        notes: sub.notes ?? null,
        startDate: sub.startDate ?? null,
        ...(sub.endDate !== undefined && { endDate: sub.endDate }),
        paymentMethod: sub.paymentMethod ?? null,
        isArchived: sub.status === 'Archived',
        status: sub.status,
        reminderDays: sub.reminderDays ?? null,
        reminderHour: sub.reminderHour ?? null,
        notificationId: sub.notificationId ?? null,
        snoozedUntil: sub.snoozedUntil ?? null,
        createdAt: now,
        updatedAt: now,
      });

      const saved: Subscription = { ...sub, id: docRef.id, updatedAt: now };
      // local_ -> real-id transition: re-key notifications to the real id
      // and drop the ghost row (see rekeySyncedRowNotifications).
      let finalSaved = saved;
      try {
        finalSaved = await rekeySyncedRowNotifications(userId, docRef.id, sub, saved);
      } catch (e) {
        console.log('[subscriptions] rekey after sync failed, keeping synced row', e);
      }
      const replaced = mergeLocal(
        nextLocal.filter((s) => s.id !== sub.id),
        finalSaved
      );
      await writeLocal(userId, replaced);
      return finalSaved;
    }

    await setDoc(
      doc(firestore, 'users', userId, 'subscriptions', sub.id),
      {
        serviceName: sub.serviceName,
        category: sub.category,
        amount: sub.amount,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        billingDay: sub.billingDay,
        notes: sub.notes ?? null,
        startDate: sub.startDate ?? null,
        endDate: sub.endDate ?? deleteField(),
        paymentMethod: sub.paymentMethod ?? null,
        isArchived: sub.status === 'Archived',
        status: sub.status,
        reminderDays: sub.reminderDays ?? null,
        reminderHour: sub.reminderHour ?? null,
        notificationId: sub.notificationId ?? null,
        snoozedUntil: sub.snoozedUntil ?? null,
        updatedAt: now,
      },
      { merge: true }
    );

    return sub;
  } catch (e) {
    // Firestore write failed but the local cache already has the new data.
    // Flag it pending (surfaced to callers via the return value) so a later
    // listSubscriptions fetch won't clobber it with stale server data.
    // The next successful upsert of this subscription clears the flag.
    console.log('[subscriptions] upsertSubscription Firestore failed (local kept, pendingSync)', e);
    const pending: Subscription = { ...sub, pendingSync: true };
    const nextLocal = mergeLocal(local, pending);
    await writeLocal(userId, nextLocal);
    return pending;
  }
}

/**
 * Retry Firestore writes for rows still flagged pendingSync (e.g. an offline
 * snooze). Fire-and-forget safe: never throws, no UI — rows that fail again
 * simply stay flagged for the next attempt.
 *
 * Guarded per id (same pattern as withSnoozeLock): the sweep runs on every
 * refetch, so overlapping sweeps must not upsert the same row concurrently.
 */
const retryInflight = new Set<string>();

export async function retryPendingSyncs(
  userId: string,
  subs: Subscription[]
): Promise<{ originalId: string; subscription: Subscription }[]> {
  const pending = subs.filter((s) => s.pendingSync === true && !retryInflight.has(s.id));
  if (pending.length === 0) return [];
  console.log('[subscriptions] retryPendingSyncs', { count: pending.length });
  const settled = await Promise.allSettled(
    pending.map(async (s) => {
      if (retryInflight.has(s.id)) return null;
      retryInflight.add(s.id);
      try {
        // The snapshot may be stale (an edit may have landed after the sweep
        // listed it). Only retry when this is still the current local version
        // still flagged pending — otherwise skip rather than clobber newer
        // data (or resurrect a deleted row) with a stale write.
        const current = await getSubscription(userId, s.id);
        if (
          !current ||
          current.pendingSync !== true ||
          (current.updatedAt ?? 0) !== (s.updatedAt ?? 0)
        ) {
          console.log('[subscriptions] retryPendingSyncs skipping stale snapshot', { id: s.id });
          return null;
        }
        const synced = await upsertSubscription(userId, { ...s, pendingSync: undefined });
        return { originalId: s.id, subscription: synced };
      } finally {
        retryInflight.delete(s.id);
      }
    })
  );
  return settled
    .filter((r): r is PromiseFulfilledResult<{ originalId: string; subscription: Subscription } | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((v): v is { originalId: string; subscription: Subscription } => v !== null);
}

export async function deleteSubscription(userId: string, subscriptionId: string): Promise<void> {
  console.log('[subscriptions] deleteSubscription', { userId, subscriptionId });

  const local = await readLocal(userId);
  const nextLocal = local.filter((s) => s.id !== subscriptionId);
  await writeLocal(userId, nextLocal);

  if (!isFirebaseConfigured()) return;

  try {
    await deleteDoc(doc(firestore, 'users', userId, 'subscriptions', subscriptionId));
  } catch (e) {
    console.log('[subscriptions] deleteSubscription Firestore failed', e);
  }
}

function mergeLocal(prev: Subscription[], next: Subscription): Subscription[] {
  const copy = [...prev];
  const idx = copy.findIndex((s) => s.id === next.id);
  if (idx >= 0) {
    copy[idx] = next;
    return copy;
  }
  return [next, ...copy];
}
