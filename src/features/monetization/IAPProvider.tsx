/**
 * IAP Provider
 *
 * React context provider for in-app purchase state management.
 * Initializes connection to Play Store, listens for purchase updates,
 * and exposes purchase/restore functions.
 */

import createContextHook from '@nkzw/create-context-hook';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  Product,
  Purchase,
  PurchaseError,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';

import { useAuth } from '@/src/features/auth/AuthProvider';
import {
  acknowledgePurchase,
  endIAP,
  fetchProductDetails,
  initIAP,
  isAlreadyOwned,
  isUserCancellation,
  PREMIUM_PRODUCT_ID,
  purchasePremium,
  restorePurchases,
  validatePurchaseOnServer,
} from '@/src/features/monetization/iapService';
import { getFirebaseAuth } from '@/src/lib/firebase';

export type IAPState = {
  isReady: boolean;
  isLoading: boolean;
  products: Product[];
  purchase: () => Promise<void>;
  restore: () => Promise<boolean>;
};

export const [IAPProvider, useIAP] = createContextHook<IAPState>(() => {
  const { user, isPremium } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingPurchase, setPendingPurchase] = useState<Purchase | null>(null);

  // Initialize IAP connection
  useEffect(() => {
    if (Platform.OS !== 'android') {
      console.log('[IAPProvider] Skipping IAP init - not Android');
      setIsReady(true);
      return;
    }

    let mounted = true;

    const init = async () => {
      const connected = await initIAP();
      if (!mounted) return;

      if (connected) {
        const fetchedProducts = await fetchProductDetails();
        if (mounted) {
          setProducts(fetchedProducts);
          setIsReady(true);
        }
      } else {
        setIsReady(true);
      }
    };

    init();

    return () => {
      mounted = false;
      endIAP();
    };
  }, []);

  // Retry acknowledgePurchase with exponential backoff
  const acknowledgeWithRetry = useCallback(
    async (
      purchase: Purchase,
      maxAttempts: number = 3,
      baseDelayMs: number = 500
    ): Promise<{ success: boolean; error?: Error }> => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await acknowledgePurchase(purchase);
          console.log(`[IAPProvider] Acknowledgement succeeded on attempt ${attempt}`);
          return { success: true };
        } catch (error) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1); // 500ms, 1000ms, 2000ms
          console.error(`[IAPProvider] Acknowledgement attempt ${attempt}/${maxAttempts} failed`, {
            productId: purchase.productId,
            purchaseToken: purchase.purchaseToken?.slice(0, 20) + '...',
            transactionId: purchase.transactionId,
            error: (error as Error).message,
          });

          if (attempt < maxAttempts) {
            console.log(`[IAPProvider] Retrying acknowledgement in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            return { success: false, error: error as Error };
          }
        }
      }
      return { success: false, error: new Error('Max retry attempts reached') };
    },
    []
  );

  // Handle successful purchases
  const handlePurchaseSuccess = useCallback(
    async (purchase: Purchase) => {
      console.log('[IAPProvider] Purchase successful:', purchase);

      if (!user) {
        console.error('[IAPProvider] No user for purchase validation');
        return;
      }

      try {
        // Get Firebase Auth token
        const auth = getFirebaseAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert('Authentication Error', 'Please sign in again.');
          return;
        }
        const authToken = await currentUser.getIdToken();

        // Validate on server
        const validation = await validatePurchaseOnServer(user.uid, purchase, authToken);

        if (validation.valid) {
          // Acknowledge the purchase with retry strategy
          const ackResult = await acknowledgeWithRetry(purchase);

          if (ackResult.success) {
            // Navigate to success screen
            router.replace('/payment-success');
          } else {
            // Log detailed failure for debugging/support
            console.error('[IAPProvider] Acknowledgement failed after all retries', {
              userId: user.uid,
              productId: purchase.productId,
              purchaseToken: purchase.purchaseToken,
              transactionId: purchase.transactionId,
              transactionDate: purchase.transactionDate,
              error: ackResult.error?.message,
            });

            // Purchase is validated, premium is granted on server
            // Navigate to success but inform user about pending acknowledgement
            Alert.alert(
              'Purchase Complete',
              'Your premium access is active! There was a minor issue finalizing the transaction. ' +
                'If you experience any problems, please contact support with your purchase details.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/payment-success'),
                },
              ]
            );
          }
        } else {
          Alert.alert('Purchase Error', validation.message || 'Purchase validation failed.');
        }
      } catch (error) {
        console.error('[IAPProvider] Purchase processing error:', error);
        Alert.alert('Purchase Error', (error as Error).message || 'Failed to process purchase.');
      } finally {
        setIsLoading(false);
      }
    },
    [user, acknowledgeWithRetry]
  );

  // Listen for purchase updates
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const purchaseUpdateSubscription = purchaseUpdatedListener((purchase: Purchase) => {
      console.log('[IAPProvider] Purchase update:', purchase);

      if (purchase.productId === PREMIUM_PRODUCT_ID) {
        handlePurchaseSuccess(purchase);
      }
    });

    const purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
      console.log('[IAPProvider] Purchase error:', error);
      setIsLoading(false);

      if (!isUserCancellation(error)) {
        if (isAlreadyOwned(error)) {
          Alert.alert(
            'Already Purchased',
            'You already own Premium. Try restoring your purchase.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
        }
      }
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, [handlePurchaseSuccess]);

  // Clear pending purchase after it's been handled
  useEffect(() => {
    if (pendingPurchase && isPremium) {
      setPendingPurchase(null);
    }
  }, [pendingPurchase, isPremium]);

  const purchase = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to unlock Premium.');
      return;
    }

    if (Platform.OS !== 'android') {
      Alert.alert('Not Available', 'Purchases are only available on Android.');
      return;
    }

    setIsLoading(true);
    try {
      await purchasePremium();
      // The result will be handled by purchaseUpdatedListener
    } catch (error) {
      setIsLoading(false);
      if (!isUserCancellation(error)) {
        Alert.alert('Purchase Error', (error as Error).message);
      }
    }
  }, [user]);

  const restore = useCallback(async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to restore your purchase.');
      return false;
    }

    if (Platform.OS !== 'android') {
      Alert.alert('Not Available', 'Restore is only available on Android.');
      return false;
    }

    setIsLoading(true);
    try {
      const purchases = await restorePurchases();

      if (purchases.length === 0) {
        Alert.alert(
          'No Purchases Found',
          'No previous premium purchase was found for this account.'
        );
        setIsLoading(false);
        return false;
      }

      // Get Firebase Auth token
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Authentication Error', 'Please sign in again.');
        setIsLoading(false);
        return false;
      }
      const authToken = await currentUser.getIdToken();

      // Sort purchases by transactionDate (newest first) to get the most recent
      // Handle missing, string, or number date formats by normalizing to timestamp
      const parseTransactionDate = (date: string | number | undefined): number => {
        if (date === undefined || date === null) return 0;
        if (typeof date === 'number') return date;
        if (typeof date === 'string') {
          const parsed = parseInt(date, 10);
          return isNaN(parsed) ? new Date(date).getTime() || 0 : parsed;
        }
        return 0;
      };

      const sortedPurchases = [...purchases].sort((a, b) => {
        const dateA = parseTransactionDate(a.transactionDate);
        const dateB = parseTransactionDate(b.transactionDate);
        return dateB - dateA; // newest first
      });

      const latestPurchase = sortedPurchases[0];

      // Guard against empty array after processing
      if (!latestPurchase) {
        Alert.alert('No Valid Purchases', 'Could not find a valid purchase to restore.');
        setIsLoading(false);
        return false;
      }

      const validation = await validatePurchaseOnServer(user.uid, latestPurchase, authToken);

      if (validation.valid) {
        // Acknowledge with retry strategy
        const ackResult = await acknowledgeWithRetry(latestPurchase);

        if (!ackResult.success) {
          // Log detailed failure for debugging/support
          console.error('[IAPProvider] Restore acknowledgement failed after all retries', {
            userId: user.uid,
            productId: latestPurchase.productId,
            purchaseToken: latestPurchase.purchaseToken,
            transactionId: latestPurchase.transactionId,
            error: ackResult.error?.message,
          });

          // Still return success since validation passed and premium is granted
          Alert.alert(
            'Restore Complete',
            'Your premium access has been restored! There was a minor issue finalizing. ' +
              'If you experience any problems, please contact support.'
          );
        }

        setIsLoading(false);
        return true;
      } else {
        Alert.alert('Restore Failed', validation.message || 'Could not validate your purchase.');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[IAPProvider] Restore error:', error);
      Alert.alert('Restore Failed', (error as Error).message);
      setIsLoading(false);
      return false;
    }
  }, [user, acknowledgeWithRetry]);

  return useMemo(
    () => ({
      isReady,
      isLoading,
      products,
      purchase,
      restore,
    }),
    [isReady, isLoading, products, purchase, restore]
  );
});
