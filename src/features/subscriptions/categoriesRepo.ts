import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';

import { firestore, isFirebaseConfigured } from '@/src/lib/firebase';

const STORAGE_KEY_PREFIX = 'categories:v1:';

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export type CustomCategory = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
};

export type CustomCategoryInput = {
  name: string;
  color: string;
};

// Default color palette for custom categories
export const CATEGORY_COLOR_OPTIONS = [
  '#EA580C', // Orange
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#0284C7', // Sky
] as const;

async function readLocal(userId: string): Promise<CustomCategory[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CustomCategory =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.createdAt === 'number'
      )
      .map((item) => ({
        ...item,
        // Ensure color exists (migration for old data)
        color: typeof item.color === 'string' ? item.color : CATEGORY_COLOR_OPTIONS[0],
      }));
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
        color: typeof data.color === 'string' ? data.color : CATEGORY_COLOR_OPTIONS[0],
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

export async function addCustomCategory(
  userId: string,
  input: CustomCategoryInput
): Promise<CustomCategory> {
  const now = Date.now();
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error('Category name cannot be empty');
  }

  if (trimmedName.length > 30) {
    throw new Error('Category name cannot exceed 30 characters');
  }

  const local = await readLocal(userId);

  // Check for duplicates (case-insensitive)
  if (local.some((cat) => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error('Category already exists');
  }

  const newCategory: CustomCategory = {
    id: `local_${now}_${Math.random().toString(16).slice(2)}`,
    name: trimmedName,
    color: input.color,
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
      color: input.color,
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

/**
 * Delete a custom category and reassign all subscriptions using it to "Other".
 * Returns the number of subscriptions that were reassigned.
 */
export async function deleteCustomCategoryWithReassignment(
  userId: string,
  categoryId: string,
  categoryName: string
): Promise<number> {
  console.log('[categories] deleteCustomCategoryWithReassignment', {
    userId,
    categoryId,
    categoryName,
  });

  // First, delete from local
  const local = await readLocal(userId);
  const nextLocal = local.filter((cat) => cat.id !== categoryId);
  await writeLocal(userId, nextLocal);

  if (!isFirebaseConfigured()) return 0;

  try {
    // Get all subscriptions with this category
    const subsCol = collection(firestore, 'users', userId, 'subscriptions');
    const snap = await getDocs(subsCol);

    const batch = writeBatch(firestore);
    let reassignedCount = 0;

    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.category === categoryName) {
        batch.update(d.ref, { category: 'Other' });
        reassignedCount++;
      }
    });

    // Delete the category
    batch.delete(doc(firestore, 'users', userId, 'categories', categoryId));

    await batch.commit();
    return reassignedCount;
  } catch (e) {
    console.log('[categories] deleteCustomCategoryWithReassignment Firestore failed', e);
    // Still delete locally even if Firestore fails
    try {
      await deleteDoc(doc(firestore, 'users', userId, 'categories', categoryId));
    } catch {
      // Ignore
    }
    return 0;
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

/**
 * Get count of subscriptions using a specific category.
 */
export async function getSubscriptionCountForCategory(
  userId: string,
  categoryName: string
): Promise<number> {
  if (!userId || !categoryName) return 0;

  if (!isFirebaseConfigured()) {
    // For local-only mode, we'd need to read subscriptions from local storage
    // This is a simplified implementation
    return 0;
  }

  try {
    const subsCol = collection(firestore, 'users', userId, 'subscriptions');
    const snap = await getDocs(subsCol);
    return snap.docs.filter((d) => d.data().category === categoryName).length;
  } catch (e) {
    console.log('[categories] getSubscriptionCountForCategory failed', e);
    return 0;
  }
}
