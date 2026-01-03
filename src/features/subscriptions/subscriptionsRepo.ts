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

    await writeLocal(userId, out);

    return out;
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
    if (!d.exists()) return null;

    return mapDocToSubscription(d.id, userId, d.data() as Record<string, unknown>);
  } catch (e) {
    console.log('[subscriptions] getSubscription failed', e);
    // Fallback to local
    const local = await readLocal(userId);
    return local.find((s) => s.id === subscriptionId) ?? null;
  }
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
        createdAt: now,
        updatedAt: now,
      });

      const saved: Subscription = { ...sub, id: docRef.id, updatedAt: now };
      const replaced = mergeLocal(nextLocal, saved);
      await writeLocal(userId, replaced);
      return saved;
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
        updatedAt: now,
      },
      { merge: true }
    );

    return sub;
  } catch (e) {
    console.log('[subscriptions] upsertSubscription Firestore failed (local kept)', e);
    return sub;
  }
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
