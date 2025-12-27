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
import { firestore, isFirebaseConfigured, timestampToMillis } from '@/src/lib/firebase';

const STORAGE_KEY_PREFIX = 'customServices:v1:';

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function nowMillis() {
  return Date.now();
}

function normalizeCustomService(raw: unknown): CustomService | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<CustomService> & { id?: unknown };

  if (typeof r.id !== 'string') return null;
  if (typeof r.name !== 'string') return null;
  if (typeof r.category !== 'string') return null;
  if (typeof r.color !== 'string') return null;

  return {
    id: r.id,
    name: r.name,
    category: r.category as CustomService['category'],
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
    console.log('[customServices] listCustomServices from Firestore', { userId });
    const servicesCol = collection(firestore, 'users', userId, 'customServices');

    const q = query(servicesCol, orderBy('name', 'asc'));

    const snap = await getDocs(q);
    const out: CustomService[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;

      return {
        id: d.id,
        name: String(data.name ?? ''),
        category: String(data.category ?? 'Other') as CustomService['category'],
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
  const now = nowMillis();

  const service: CustomService = {
    id: `local_${now}_${Math.random().toString(16).slice(2)}`,
    name: input.name,
    category: input.category,
    color: input.color,
    createdAt: now,
  };

  const local = await readLocal(userId);
  const nextLocal = [service, ...local];
  await writeLocal(userId, nextLocal);

  if (!isFirebaseConfigured()) {
    console.log('[customServices] addCustomService local-only', { userId, id: service.id });
    return service;
  }

  try {
    console.log('[customServices] addCustomService Firestore', { userId, name: service.name });
    const servicesCol = collection(firestore, 'users', userId, 'customServices');
    const docRef = await addDoc(servicesCol, {
      name: service.name,
      category: service.category,
      color: service.color,
      createdAt: serverTimestamp(),
    });

    const saved: CustomService = { ...service, id: docRef.id };
    const replaced = nextLocal.map((s) => (s.id === service.id ? saved : s));
    await writeLocal(userId, replaced);
    return saved;
  } catch (e) {
    console.log('[customServices] addCustomService Firestore failed (local kept)', e);
    return service;
  }
}

export async function deleteCustomService(userId: string, serviceId: string): Promise<void> {
  console.log('[customServices] deleteCustomService', { userId, serviceId });

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
