/**
 * In-App Purchase Service
 *
 * Handles Android one-time purchase for premium upgrade using react-native-iap.
 * Server-side validation is performed via Firebase Functions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  Product,
  Purchase,
  PurchaseError,
  requestPurchase,
} from 'react-native-iap';

// Product ID for one-time premium purchase
// This should match the product ID in Google Play Console
export const PREMIUM_PRODUCT_ID = 'com.horizon.recurr.premium';

// Firebase Functions endpoint for purchase validation
// Update this with your actual Firebase Functions URL after deployment
const VALIDATE_PURCHASE_URL = `https://us-central1-recurr-app.cloudfunctions.net/validateAndroidPurchase`;

// Storage key prefix for failed purchase acknowledgements (per-purchase key approach)
const FAILED_PURCHASE_KEY_PREFIX = '@iap_failed_ack_';
// Background task name for retrying acknowledgements
const IAP_ACK_RETRY_TASK = 'IAP_ACK_RETRY_TASK';

/**
 * Initialize connection to the Play Store
 */
export async function initIAP(): Promise<boolean> {
  try {
    const result = await initConnection();
    console.log('[IAP] Connection initialized:', result);
    return true;
  } catch (error) {
    console.error('[IAP] Failed to initialize connection:', error);
    return false;
  }
}

/**
 * End connection to the Play Store
 * Should be called when the IAP provider unmounts
 */
export async function endIAP(): Promise<void> {
  try {
    await endConnection();
    console.log('[IAP] Connection ended');
  } catch (error) {
    console.error('[IAP] Failed to end connection:', error);
  }
}

/**
 * Fetch product details from Play Store
 */
export async function fetchProductDetails(): Promise<Product[]> {
  try {
    const products = await fetchProducts({
      skus: [PREMIUM_PRODUCT_ID],
      type: 'in-app',
    });
    console.log('[IAP] Products fetched:', products);
    // Filter to only in-app products and cast
    return (products ?? []).filter((p): p is Product => p.type === 'in-app');
  } catch (error) {
    console.error('[IAP] Failed to fetch products:', error);
    return [];
  }
}

/**
 * Initiate a purchase for the premium product
 */
export async function purchasePremium(): Promise<void> {
  try {
    console.log('[IAP] Requesting purchase for:', PREMIUM_PRODUCT_ID);
    await requestPurchase({
      type: 'in-app',
      request: {
        google: {
          skus: [PREMIUM_PRODUCT_ID],
        },
      },
    });
    // The actual purchase result will be handled by the purchaseUpdatedListener
  } catch (error) {
    console.error('[IAP] Purchase request failed:', error);

    // Use centralized helper functions for consistent error checking
    if (isUserCancellation(error)) {
      throw new Error('Purchase cancelled');
    } else if (isProductUnavailable(error)) {
      throw new Error('This product is not available');
    } else if (isAlreadyOwned(error)) {
      throw new Error('You already own this product. Try restoring your purchase.');
    } else {
      throw new Error('Purchase failed. Please try again.');
    }
  }
}

/**
 * Restore previous purchases
 * Returns true if a valid premium purchase was found
 */
export async function restorePurchases(): Promise<Purchase[]> {
  try {
    console.log('[IAP] Restoring purchases...');
    const purchases = await getAvailablePurchases();
    console.log('[IAP] Available purchases:', purchases);

    // Filter for our premium product
    const premiumPurchases = purchases.filter(
      (purchase) => purchase.productId === PREMIUM_PRODUCT_ID
    );

    return premiumPurchases;
  } catch (error) {
    console.error('[IAP] Failed to restore purchases:', error);
    throw new Error('Failed to restore purchases. Please try again.');
  }
}

/**
 * Validate a purchase with the server
 * Requires Firebase Auth token for authentication
 */
export async function validatePurchaseOnServer(
  userId: string,
  purchase: Purchase,
  authToken: string
): Promise<{ valid: boolean; message?: string }> {
  const REQUEST_TIMEOUT_MS = 10000; // 10 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log('[IAP] Validating purchase on server...');

    const response = await fetch(VALIDATE_PURCHASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId,
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken,
        packageName: 'com.horizon.recurr',
      }),
      signal: controller.signal,
    });

    // Clear timeout on successful response
    clearTimeout(timeoutId);

    if (response.status === 401) {
      throw new Error('Authentication failed. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('Not authorized to validate this purchase.');
    }

    if (!response.ok) {
      throw new Error(`Server validation failed: ${response.status}`);
    }

    const result = await response.json();

    // Debug logging (only in development)
    if (__DEV__) {
      console.log('[IAP] Server validation result:', result);
    }

    // Validate response shape
    if (typeof result !== 'object' || result === null) {
      throw new Error('Invalid server response format.');
    }

    if (typeof result.valid !== 'boolean') {
      throw new Error('Invalid server response: missing validation status.');
    }

    // Check if validation failed
    if (!result.valid) {
      // Validate optional fields before using them to prevent runtime errors
      const message = typeof result.message === 'string' ? result.message : undefined;
      const error = typeof result.error === 'string' ? result.error : undefined;
      const code =
        typeof result.code === 'string' || typeof result.code === 'number'
          ? String(result.code)
          : undefined;
      const status =
        typeof result.status === 'string' || typeof result.status === 'number'
          ? String(result.status)
          : undefined;

      const errorMessage = message || error || 'Purchase validation failed.';
      const errorCode = code || status;
      throw new Error(errorCode ? `${errorMessage} (Code: ${errorCode})` : errorMessage);
    }

    return result as { valid: boolean; message?: string };
  } catch (error) {
    // Clear timeout on error as well
    clearTimeout(timeoutId);

    console.error('[IAP] Server validation error:', error);

    // Handle abort/timeout errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }

    // Re-throw with user-friendly message
    throw new Error(
      (error as Error).message || 'Failed to validate purchase. Please contact support.'
    );
  }
}

/**
 * Acknowledge/finish a purchase transaction
 * This must be called within 3 days of purchase or it will be refunded.
 * Includes robust retry logic and persistence for background recovery.
 */
export async function acknowledgePurchase(purchase: Purchase): Promise<void> {
  const RETRY_DELAYS = [500, 1500, 4500];
  let attempt = 0;

  while (attempt < RETRY_DELAYS.length) {
    try {
      console.log(`[IAP] Acknowledging purchase (attempt ${attempt + 1})...`);
      await finishTransaction({ purchase, isConsumable: false });

      console.log('[IAP] Purchase acknowledged successfully');

      // If we succeeded, we also check if this was a saved failure and remove it
      if (purchase.purchaseToken) {
        await removeFailedPurchase(purchase.purchaseToken);
      }
      return;
    } catch (error) {
      console.error(`[IAP] Failed to acknowledge purchase (attempt ${attempt + 1}):`, error);

      const delay = RETRY_DELAYS[attempt];
      if (attempt < RETRY_DELAYS.length - 1) {
        // wait for next attempt
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      attempt++;
    }
  }

  // If we get here, all retries failed.
  // 1. Persist to storage for background retry
  console.warn('[IAP] All retries failed. Persisting to storage for background retry.');
  await saveFailedPurchase(purchase);

  // 2. Log monitoring event (ensure ops are notified)
  logError('[IAP] FATAL: Failed to acknowledge purchase after retries', {
    purchaseId: purchase.productId,
    token: purchase.purchaseToken,
    orderId: purchase.transactionId,
  });

  // 3. Register bg task if needed (ensure it's running)
  await registerBackgroundTask();

  // Do NOT throw to caller - we want the UI to consider it "processed"
  // while we handle the ack guarantee in the background.
}

/**
 * Save a failed purchase to AsyncStorage using per-purchase keys.
 * This approach is atomic and race-free: each purchase is stored independently
 * under its own key, so concurrent calls won't lose data.
 */
async function saveFailedPurchase(purchase: Purchase): Promise<void> {
  if (!purchase.purchaseToken) {
    console.warn('[IAP] Cannot save failed purchase: missing purchaseToken');
    return;
  }

  const key = `${FAILED_PURCHASE_KEY_PREFIX}${purchase.purchaseToken}`;

  try {
    // Each purchase has its own key - no read-modify-write needed
    // This is atomic and safe for concurrent calls
    await AsyncStorage.setItem(key, JSON.stringify(purchase));
    console.log('[IAP] Saved failed purchase for retry:', purchase.purchaseToken);
  } catch (e) {
    console.error('[IAP] Failed to save persistence for ack retry:', e);
  }
}

/**
 * Remove a failed purchase from AsyncStorage (after successful ack).
 * Uses per-purchase key so removal is atomic and race-free.
 */
async function removeFailedPurchase(purchaseToken: string): Promise<void> {
  const key = `${FAILED_PURCHASE_KEY_PREFIX}${purchaseToken}`;

  try {
    await AsyncStorage.removeItem(key);
    console.log('[IAP] Removed failed purchase after successful ack:', purchaseToken);
  } catch (e) {
    console.error('[IAP] Failed to remove persistence for ack retry:', e);
  }
}

/**
 * Get all failed purchases from AsyncStorage.
 * Uses getAllKeys + multiGet for atomic retrieval of all per-purchase keys.
 */
async function getFailedPurchases(): Promise<Purchase[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const failedKeys = allKeys.filter((key) => key.startsWith(FAILED_PURCHASE_KEY_PREFIX));

    if (failedKeys.length === 0) {
      return [];
    }

    // multiGet is atomic and returns all values at once
    const keyValuePairs = await AsyncStorage.multiGet(failedKeys);

    const purchases: Purchase[] = [];
    for (const [, value] of keyValuePairs) {
      if (value) {
        try {
          purchases.push(JSON.parse(value) as Purchase);
        } catch (parseError) {
          console.error('[IAP] Failed to parse stored purchase:', parseError);
        }
      }
    }

    return purchases;
  } catch (e) {
    console.error('[IAP] Failed to get failed purchases:', e);
    return [];
  }
}

/**
 * Register background task for retries
 */
async function registerBackgroundTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(IAP_ACK_RETRY_TASK);
    if (!isRegistered) {
      await BackgroundTask.registerTaskAsync(IAP_ACK_RETRY_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
      });
      console.log('[IAP] Background retry task registered');
    }
  } catch (e) {
    console.error('[IAP] Failed to register background task:', e);
  }
}

/**
 * Mock monitoring service - replace with actual implementation (e.g. Sentry)
 */
function logError(message: string, context: object) {
  // In a real app, send to Sentry/Crashlytics
  console.error(message, context);
  if (__DEV__) {
    // alert for dev visibility
    console.warn('Simulating Sentry alert:', message);
  }
}

// Define the background task
TaskManager.defineTask(IAP_ACK_RETRY_TASK, async () => {
  console.log('[IAP] Background task running: retrying acknowledgements');

  // Use the per-purchase key helper to get all failed purchases atomically
  const failedList = await getFailedPurchases();
  if (failedList.length === 0) return BackgroundTask.BackgroundTaskResult.Success;

  // Initialize IAP connection before attempting to acknowledge purchases
  let connectionInitialized = false;
  try {
    connectionInitialized = await initIAP();
    if (!connectionInitialized) {
      console.error('[IAP] Background task: Failed to initialize IAP connection');
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    let successCount = 0;

    // Try to acknowledge each again
    for (const purchase of failedList) {
      try {
        if (!purchase.purchaseToken) continue;

        await finishTransaction({ purchase, isConsumable: false });
        // If we succeed here, remove it immediately
        await removeFailedPurchase(purchase.purchaseToken);
        successCount++;
      } catch (e) {
        console.error('[IAP] Background retry failed for token:', purchase.purchaseToken, e);
        // It stays in storage for next time
      }
    }

    console.log(`[IAP] Background retry finished. Success: ${successCount}/${failedList.length}`);

    return failedList.length === successCount
      ? BackgroundTask.BackgroundTaskResult.Success
      : BackgroundTask.BackgroundTaskResult.Failed;
  } catch (error) {
    console.error('[IAP] Background task error:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  } finally {
    // Always clean up the billing connection
    if (connectionInitialized) {
      try {
        await endConnection();
        console.log('[IAP] Background task: Connection closed');
      } catch (endError) {
        console.error('[IAP] Background task: Failed to close connection:', endError);
      }
    }
  }
});

/**
 * Check if a purchase error is a user cancellation
 */
export function isUserCancellation(error: unknown): boolean {
  const purchaseError = error as PurchaseError;
  const msg = purchaseError?.message?.toLowerCase() ?? '';
  return msg.includes('cancel');
}

/**
 * Check if a purchase error is "already owned"
 */
export function isAlreadyOwned(error: unknown): boolean {
  const purchaseError = error as PurchaseError;
  const msg = purchaseError?.message?.toLowerCase() ?? '';
  return msg.includes('already owned') || msg.includes('already purchased');
}

/**
 * Check if a purchase error is "product unavailable/not found"
 */
export function isProductUnavailable(error: unknown): boolean {
  const purchaseError = error as PurchaseError;
  const msg = purchaseError?.message?.toLowerCase() ?? '';
  return msg.includes('unavailable') || msg.includes('not found');
}
