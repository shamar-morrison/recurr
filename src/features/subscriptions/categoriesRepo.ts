import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';

import { firestore, isFirebaseConfigured } from '@/src/lib/firebase';

const STORAGE_KEY_PREFIX = 'categories:v1:';

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export type CustomCategory = {
  id: string;
  name: string;
  createdAt: number;
};

async function readLocal(userId: string): Promise<CustomCategory[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CustomCategory =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.createdAt === 'number'
    );
  } catch (e) {
    console.log('[categories] readLocal failed', e);
    return [];
  }
}

async function writeLocal(userId: string, categories: CustomCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(categories));
  } catch (e) {
    console.log('[categories] writeLocal failed', e);
  }
}

export async function listCustomCategories(userId: string): Promise<CustomCategory[]> {
  if (!userId) return [];

  if (!isFirebaseConfigured()) {
    console.log('[categories] Firebase not configured; using local store');
    return readLocal(userId);
  }

  try {
    console.log('[categories] listCustomCategories from Firestore', { userId });
    const catCol = collection(firestore, 'users', userId, 'categories');
    const q = query(catCol, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);

    const out: CustomCategory[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name ?? ''),
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      };
    });

    await writeLocal(userId, out);
    return out;
  } catch (e) {
    console.log('[categories] listCustomCategories Firestore failed -> fallback local', e);
    return readLocal(userId);
  }
}

export async function addCustomCategory(userId: string, name: string): Promise<CustomCategory> {
  const now = Date.now();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Category name cannot be empty');
  }

  const local = await readLocal(userId);

  // Check for duplicates (case-insensitive)
  if (local.some((cat) => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error('Category already exists');
  }

  const newCategory: CustomCategory = {
    id: `local_${now}_${Math.random().toString(16).slice(2)}`,
    name: trimmedName,
    createdAt: now,
  };

  const nextLocal = [...local, newCategory];
  await writeLocal(userId, nextLocal);

  if (!isFirebaseConfigured()) {
    console.log('[categories] addCustomCategory local-only', { userId, name: trimmedName });
    return newCategory;
  }

  try {
    console.log('[categories] addCustomCategory Firestore', { userId, name: trimmedName });
    const catCol = collection(firestore, 'users', userId, 'categories');
    const docRef = await addDoc(catCol, {
      name: trimmedName,
      createdAt: now,
    });

    const saved: CustomCategory = { ...newCategory, id: docRef.id };

    // Update local with real ID
    const replaced = nextLocal.map((cat) => (cat.id === newCategory.id ? saved : cat));
    await writeLocal(userId, replaced);

    return saved;
  } catch (e) {
    console.log('[categories] addCustomCategory Firestore failed (local kept)', e);
    return newCategory;
  }
}

export async function deleteCustomCategory(userId: string, categoryId: string): Promise<void> {
  console.log('[categories] deleteCustomCategory', { userId, categoryId });

  const local = await readLocal(userId);
  const nextLocal = local.filter((cat) => cat.id !== categoryId);
  await writeLocal(userId, nextLocal);

  if (!isFirebaseConfigured()) return;

  try {
    await deleteDoc(doc(firestore, 'users', userId, 'categories', categoryId));
  } catch (e) {
    console.log('[categories] deleteCustomCategory Firestore failed', e);
  }
}
