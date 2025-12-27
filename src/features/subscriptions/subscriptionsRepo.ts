import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { firestore, isFirebaseConfigured, timestampToMillis } from '@/src/lib/firebase';
import { Subscription, SubscriptionInput } from '@/src/features/subscriptions/types';

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
    isArchived: Boolean(r.isArchived),
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
    const out: Subscription[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;

      return {
        id: d.id,
        userId,
        serviceName: String(data.serviceName ?? ''),
        category: String(data.category ?? 'Other') as Subscription['category'],
        amount: typeof data.amount === 'number' ? data.amount : 0,
        currency: String(data.currency ?? 'USD'),
        billingCycle: String(data.billingCycle ?? 'Monthly') as Subscription['billingCycle'],
        billingDay: typeof data.billingDay === 'number' ? data.billingDay : 1,
        notes: typeof data.notes === 'string' ? data.notes : undefined,
        isArchived: Boolean(data.isArchived),
        createdAt: timestampToMillis(data.createdAt),
        updatedAt: timestampToMillis(data.updatedAt),
      };
    });

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

export async function upsertSubscription(
  userId: string,
  input: SubscriptionInput
): Promise<Subscription> {
  const now = nowMillis();

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
    isArchived: Boolean(input.isArchived),
    createdAt: (input as Partial<Subscription>).createdAt ?? now,
    updatedAt: now,
  };

  const local = await readLocal(userId);
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
        isArchived: sub.isArchived ?? false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
        isArchived: sub.isArchived ?? false,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
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
