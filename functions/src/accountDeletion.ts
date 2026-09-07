/**
 * Account deletion Cloud Function (V1 callable).
 *
 * Mirrors ShowSeek's deleteAccount flow, adapted for Recurr's data model:
 * - Deletes users/{uid} recursively (subscriptions, categories, customServices)
 * - Deletes purchase_tokens docs belonging to the user (admin-only collection)
 * - Deletes the Firebase Auth user (idempotent on user-not-found)
 *
 * Order matters: Firestore first, Auth second, so a retry after a partial
 * failure can still find the uid in the request auth context.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export interface DeleteAccountResponse {
  success: true;
}

const QUERY_DELETE_BATCH_SIZE = 250;

async function deletePurchaseTokensForUser(userId: string): Promise<void> {
  const db = admin.firestore();

  while (true) {
    const snapshot = await db
      .collection('purchase_tokens')
      .where('userId', '==', userId)
      .limit(QUERY_DELETE_BATCH_SIZE)
      .get();

    if (snapshot.empty) {
      return;
    }

    const bulkWriter = db.bulkWriter();
    snapshot.docs.forEach((documentSnapshot) => {
      bulkWriter.delete(documentSnapshot.ref);
    });
    await bulkWriter.close();
  }
}

async function deleteFirestoreUserTree(userId: string): Promise<void> {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  await db.recursiveDelete(userRef);
  await deletePurchaseTokensForUser(userId);
}

async function deleteAuthUserIfPresent(userId: string): Promise<void> {
  try {
    await admin.auth().deleteUser(userId);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === 'auth/user-not-found') {
      return;
    }
    throw error;
  }
}

export async function deleteAccountHandler(userId: string): Promise<DeleteAccountResponse> {
  await deleteFirestoreUserTree(userId);
  await deleteAuthUserIfPresent(userId);

  return { success: true };
}

/**
 * V1 callable function. Auth is enforced via context.auth (verified ID token).
 */
export const deleteAccount = functions.https.onCall(async (data, context) => {
  const userId = context.auth?.uid;
  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  await deleteAccountHandler(userId);

  return { success: true } as DeleteAccountResponse;
});
