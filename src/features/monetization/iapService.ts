/**
 * In-App Purchase Service
 *
 * Handles Android one-time purchase for premium upgrade using react-native-iap.
 * Server-side validation is performed via Firebase Functions.
 */

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
const VALIDATE_PURCHASE_URL =
  'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/validateAndroidPurchase';

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
    const purchaseError = error as PurchaseError;
    console.error('[IAP] Purchase request failed:', purchaseError);

    // Check error message for user-friendly responses
    const errorMsg = purchaseError?.message?.toLowerCase() ?? '';

    if (errorMsg.includes('cancel')) {
      throw new Error('Purchase cancelled');
    } else if (errorMsg.includes('unavailable') || errorMsg.includes('not found')) {
      throw new Error('This product is not available');
    } else if (errorMsg.includes('already owned') || errorMsg.includes('already purchased')) {
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
 */
export async function validatePurchaseOnServer(
  userId: string,
  purchase: Purchase
): Promise<{ valid: boolean; message?: string }> {
  try {
    console.log('[IAP] Validating purchase on server...');

    const response = await fetch(VALIDATE_PURCHASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken,
        packageName: 'com.horizon.recurr',
      }),
    });

    if (!response.ok) {
      throw new Error(`Server validation failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[IAP] Server validation result:', result);

    return result;
  } catch (error) {
    console.error('[IAP] Server validation error:', error);
    throw new Error('Failed to validate purchase. Please contact support.');
  }
}

/**
 * Acknowledge/finish a purchase transaction
 * This must be called within 3 days of purchase or it will be refunded
 */
export async function acknowledgePurchase(purchase: Purchase): Promise<void> {
  try {
    console.log('[IAP] Acknowledging purchase...');
    await finishTransaction({ purchase, isConsumable: false });
    console.log('[IAP] Purchase acknowledged');
  } catch (error) {
    console.error('[IAP] Failed to acknowledge purchase:', error);
    // Don't throw here - the purchase is valid, just not acknowledged
    // It can be acknowledged later
  }
}

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
