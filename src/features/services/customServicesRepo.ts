/**
 * Repository for custom services.
 * Follows the same pattern as subscriptionsRepo.ts
 */

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
} from 'firebase/firestore';

import { CustomService, CustomServiceInput } from '@/src/constants/customServices';
import { SUBSCRIPTION_CATEGORIES, SubscriptionCategory } from '@/src/features/subscriptions/types';
import { firestore, isFirebaseConfigured, timestampToMillis } from '@/src/lib/firebase';

const STORAGE_KEY_PREFIX = 'customServices:v1:';

/**
 * Per-user mutex to serialize local cache writes.
 * Prevents race conditions during concurrent addCustomService calls.
 */
const userWriteLocks = new Map<string, Promise<unknown>>();

async function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  // Wait for any pending operation for this user
  const pending = userWriteLocks.get(userId) ?? Promise.resolve();

  // Chain our operation after the pending one
  const operation = pending.then(fn, fn); // Run fn regardless of prior success/failure

  // Create a single caught promise to use for both storing and comparison
  // (calling .catch() twice would create different Promise references)
  const caught = operation.catch(() => {
    /* swallow to prevent unhandled rejection in chain */
  });

  // Update the lock to include our operation
  userWriteLocks.set(userId, caught);

  try {
    return await operation;
  } finally {
    // Cleanup if we're the last operation (same reference as what we stored)
    if (userWriteLocks.get(userId) === caught) {
      userWriteLocks.delete(userId);
    }
  }
}

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function nowMillis() {
  return Date.now();
}

function isValidCategory(value: string): value is SubscriptionCategory {
  return SUBSCRIPTION_CATEGORIES.includes(value as SubscriptionCategory);
}

function normalizeCustomService(raw: unknown): CustomService | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<CustomService> & { id?: unknown };

  if (typeof r.id !== 'string') return null;
  if (typeof r.name !== 'string') return null;
  if (typeof r.category !== 'string') return null;
  if (typeof r.color !== 'string') return null;

  // Validate category against allowed values, fallback to 'Other' if invalid
  const category: SubscriptionCategory = isValidCategory(r.category) ? r.category : 'Other';

  return {
    id: r.id,
    name: r.name,
    category,
    color: r.color,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : nowMillis(),
  };
}

async function readLocal(userId: string): Promise<CustomService[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: CustomService[] = [];
    for (const item of parsed) {
      const normalized = normalizeCustomService(item);
      if (normalized) out.push(normalized);
    }
    return out;
  } catch (e) {
    console.log('[customServices] readLocal failed', e);
    return [];
  }
}

async function writeLocal(userId: string, services: CustomService[]): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(services));
  } catch (e) {
    console.log('[customServices] writeLocal failed', e);
  }
}

export async function listCustomServices(userId: string): Promise<CustomService[]> {
  if (!userId) return [];

  if (!isFirebaseConfigured()) {
    console.log('[customServices] Firebase not configured; using local store');
    const local = await readLocal(userId);
    return local.sort((a, b) => a.name.localeCompare(b.name));
  }

  try {
    console.log('[customServices] listCustomServices from Firestore', {
      userIdSuffix: userId.slice(-4),
    });
    const servicesCol = collection(firestore, 'users', userId, 'customServices');

    const q = query(servicesCol, orderBy('name', 'asc'));

    const snap = await getDocs(q);
    const out: CustomService[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const rawCategory = String(data.category ?? 'Other');

      return {
        id: d.id,
        name: String(data.name ?? ''),
        category: isValidCategory(rawCategory) ? rawCategory : 'Other',
        color: String(data.color ?? '#4ECDC4'),
        createdAt: timestampToMillis(data.createdAt),
      };
    });

    await writeLocal(userId, out);

    return out;
  } catch (e) {
    console.log('[customServices] listCustomServices Firestore failed -> fallback local', e);
    const local = await readLocal(userId);
    return local.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export async function addCustomService(
  userId: string,
  input: CustomServiceInput
): Promise<CustomService> {
  if (!userId) {
    throw new Error('[customServices] addCustomService: userId is required');
  }

  // Validate and normalize name
  const trimmedName = input.name?.trim() ?? '';
  if (!trimmedName) {
    throw new Error('[customServices] addCustomService: name is required');
  }
  const MAX_NAME_LENGTH = 100;
  if (trimmedName.length > MAX_NAME_LENGTH) {
    throw new Error(
      `[customServices] addCustomService: name exceeds max length of ${MAX_NAME_LENGTH} characters`
    );
  }

  // Validate and normalize color (hex format: #RGB or #RRGGBB)
  const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const normalizedColor = input.color?.toLowerCase() ?? '';
  if (!HEX_COLOR_REGEX.test(normalizedColor)) {
    throw new Error(
      '[customServices] addCustomService: invalid color format (expected hex like #RGB or #RRGGBB)'
    );
  }

  // Serialize per-user to prevent concurrent writes from clobbering each other
  return withUserLock(userId, async () => {
    const now = nowMillis();

    const service: CustomService = {
      id: `local_${now}_${Math.random().toString(16).slice(2)}`,
      name: trimmedName,
      category: input.category,
      color: normalizedColor,
      createdAt: now,
    };

    // Read and write atomically within the lock
    const local = await readLocal(userId);
    const nextLocal = [service, ...local];
    await writeLocal(userId, nextLocal);

    if (!isFirebaseConfigured()) {
      console.log('[customServices] addCustomService local-only', {
        userIdSuffix: userId.slice(-4),
        id: service.id,
      });
      return service;
    }

    try {
      console.log('[customServices] addCustomService Firestore', {
        userIdSuffix: userId.slice(-4),
        name: service.name,
      });
      const servicesCol = collection(firestore, 'users', userId, 'customServices');
      const docRef = await addDoc(servicesCol, {
        name: service.name,
        category: service.category,
        color: service.color,
        createdAt: serverTimestamp(),
      });

      const saved: CustomService = { ...service, id: docRef.id };

      // Re-read the freshest local list to avoid clobbering concurrent adds
      const freshLocal = await readLocal(userId);
      const replaced = freshLocal.map((s) => (s.id === service.id ? saved : s));
      await writeLocal(userId, replaced);

      return saved;
    } catch (e) {
      console.log('[customServices] addCustomService Firestore failed (local kept)', e);
      return service;
    }
  });
}

export async function deleteCustomService(userId: string, serviceId: string): Promise<void> {
  if (!userId) {
    console.warn('[customServices] deleteCustomService: userId is required');
    return;
  }

  console.log('[customServices] deleteCustomService', {
    userIdSuffix: userId.slice(-4),
    serviceId,
  });

  const local = await readLocal(userId);
  const nextLocal = local.filter((s) => s.id !== serviceId);
  await writeLocal(userId, nextLocal);

  if (!isFirebaseConfigured()) return;

  try {
    await deleteDoc(doc(firestore, 'users', userId, 'customServices', serviceId));
  } catch (e) {
    console.log('[customServices] deleteCustomService Firestore failed', e);
  }
}
