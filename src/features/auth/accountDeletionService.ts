import { httpsCallable } from 'firebase/functions';

import { getFirebaseFunctions } from '@/src/lib/firebase';

export interface DeleteAccountResult {
  success: true;
}

class AccountDeletionService {
  async deleteAccount(): Promise<DeleteAccountResult> {
    const functions = getFirebaseFunctions();
    const callable = httpsCallable<void, DeleteAccountResult>(functions, 'deleteAccount');
    const result = await callable();
    return result.data;
  }
}

export const accountDeletionService = new AccountDeletionService();
