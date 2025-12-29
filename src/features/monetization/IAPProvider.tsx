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

  // Handle successful purchases
  const handlePurchaseSuccess = useCallback(
    async (purchase: Purchase) => {
      console.log('[IAPProvider] Purchase successful:', purchase);

      if (!user) {
        console.error('[IAPProvider] No user for purchase validation');
        return;
      }

      try {
        // Validate on server
        const validation = await validatePurchaseOnServer(user.uid, purchase);

        if (validation.valid) {
          // Acknowledge the purchase
          await acknowledgePurchase(purchase);
          // Navigate to success screen
          router.replace('/payment-success');
        } else {
          Alert.alert('Purchase Error', validation.message || 'Purchase validation failed.');
        }
      } catch (error) {
        console.error('[IAPProvider] Purchase processing error:', error);
        Alert.alert('Purchase Error', 'Failed to process purchase. Please contact support.');
      } finally {
        setIsLoading(false);
      }
    },
    [user]
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

      // Validate the most recent purchase
      const latestPurchase = purchases[0];
      const validation = await validatePurchaseOnServer(user.uid, latestPurchase);

      if (validation.valid) {
        await acknowledgePurchase(latestPurchase);
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
  }, [user]);

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
