/**
 * Firebase Cloud Function for validating Android in-app purchases
 *
 * This function verifies purchases with the Google Play Developer API
 * and updates the user's premium status in Firestore.
 *
 * SECURITY:
 * - Requires Firebase Auth Bearer token in Authorization header
 * - Verifies token and compares uid to request userId
 * - CORS restricted to allowed origins
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a service account in Google Cloud Console with Play Android Developer API access
 * 2. Download the JSON key file
 * 3. Set the config variables:
 *    firebase functions:config:set google.service_account="$(cat service-account.json)"
 *    firebase functions:config:set cors.allowed_origins="https://your-app.com"
 *
 * Or use a secret manager to store the credentials securely.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { google } from 'googleapis';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Allowed origins for CORS (configure via firebase functions:config:set)
// Default to empty array which will reject all cross-origin requests
const getAllowedOrigins = (): string[] => {
  const originsConfig = functions.config().cors?.allowed_origins;
  if (!originsConfig) {
    // In development, you might want to allow localhost
    return ['http://localhost:8081', 'http://localhost:19006'];
  }
  return originsConfig.split(',').map((o: string) => o.trim());
};

// Request body interface
interface ValidatePurchaseRequest {
  userId: string;
  productId: string;
  purchaseToken: string;
  packageName: string;
}

// Response interface
interface ValidatePurchaseResponse {
  valid: boolean;
  message?: string;
  debug?: {
    googleApiError?: string;
    googleApiCode?: number;
  };
}

/**
 * Verify Firebase Auth token from request
 * Returns the decoded token if valid, null otherwise
 */
async function verifyAuthToken(
  req: functions.https.Request
): Promise<admin.auth.DecodedIdToken | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('[verifyAuthToken] Token verification failed:', error);
    return null;
  }
}

/**
 * Handle CORS with origin whitelist
 */
function handleCors(req: functions.https.Request, res: functions.Response): boolean {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }

  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true; // Request handled
  }

  return false; // Continue processing
}

/**
 * Validate an Android in-app purchase
 *
 * Verifies the purchase with Google Play and updates user's premium status
 * Requires Firebase Auth token for authentication
 */
export const validateAndroidPurchase = functions.https.onRequest(
  async (req, res): Promise<void> => {
    // Handle CORS
    if (handleCors(req, res)) {
      return; // Preflight handled
    }

    // Method check
    if (req.method !== 'POST') {
      res.status(405).json({ valid: false, message: 'Method not allowed' });
      return;
    }

    // Verify Firebase Auth token
    const decodedToken = await verifyAuthToken(req);
    if (!decodedToken) {
      res.status(401).json({
        valid: false,
        message: 'Unauthorized: Missing or invalid authentication token',
      } as ValidatePurchaseResponse);
      return;
    }

    try {
      const { userId, productId, purchaseToken, packageName } = req.body as ValidatePurchaseRequest;

      // Validate required fields
      if (!userId || !productId || !purchaseToken || !packageName) {
        res.status(400).json({ valid: false, message: 'Missing required fields' });
        return;
      }

      // Verify that the authenticated user matches the userId in the request
      if (decodedToken.uid !== userId) {
        console.warn('[validateAndroidPurchase] UID mismatch:', {
          tokenUid: decodedToken.uid,
          requestUserId: userId,
        });
        res.status(403).json({
          valid: false,
          message: 'Forbidden: User ID mismatch',
        } as ValidatePurchaseResponse);
        return;
      }

      console.log('[validateAndroidPurchase] Validating:', {
        userId,
        productId,
        packageName,
      });

      // Get service account credentials from config or environment
      const serviceAccountConfig = functions.config().google?.service_account;

      if (!serviceAccountConfig) {
        console.error('[validateAndroidPurchase] Service account not configured');
        res.status(500).json({ valid: false, message: 'Server configuration error' });
        return;
      }

      let credentials;
      try {
        credentials =
          typeof serviceAccountConfig === 'string'
            ? JSON.parse(serviceAccountConfig)
            : serviceAccountConfig;
      } catch {
        console.error('[validateAndroidPurchase] Failed to parse service account');
        res.status(500).json({ valid: false, message: 'Server configuration error' });
        return;
      }

      // Create auth client
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      const androidPublisher = google.androidpublisher({
        version: 'v3',
        auth,
      });

      // Verify purchase with Google Play
      const purchaseResponse = await androidPublisher.purchases.products.get({
        packageName,
        productId,
        token: purchaseToken,
      });

      const purchase = purchaseResponse.data;

      console.log('[validateAndroidPurchase] Google response:', purchase);

      // Check if purchase is valid
      // purchaseState: 0 = purchased, 1 = canceled, 2 = pending
      if (purchase.purchaseState !== 0) {
        res.json({
          valid: false,
          message: 'Purchase is not valid',
        } as ValidatePurchaseResponse);
        return;
      }

      // Check if already acknowledged
      if (purchase.acknowledgementState === 1) {
        // Purchase was already acknowledged, check if user is already premium
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists && userDoc.data()?.isPremium) {
          res.json({
            valid: true,
            message: 'Purchase already validated',
          } as ValidatePurchaseResponse);
          return;
        }
      }

      // Acknowledge the purchase on Google's side
      await androidPublisher.purchases.products.acknowledge({
        packageName,
        productId,
        token: purchaseToken,
      });

      // Update user's premium status in Firestore (non-sensitive data only)
      await db
        .collection('users')
        .doc(userId)
        .set(
          {
            isPremium: true,
            premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            premiumPurchase: {
              productId,
              purchaseTime: purchase.purchaseTimeMillis,
              orderId: purchase.orderId,
              validatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );

      // Store sensitive purchaseToken in admin-only collection for refunds/verification
      // This collection should have strict security rules blocking client access
      await db
        .collection('purchase_tokens')
        .doc(purchase.orderId || `${userId}_${Date.now()}`)
        .set({
          userId,
          productId,
          purchaseToken,
          orderId: purchase.orderId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log('[validateAndroidPurchase] User updated:', userId);

      res.json({
        valid: true,
        message: 'Purchase validated successfully',
      } as ValidatePurchaseResponse);
    } catch (error) {
      // Extract detailed error information for debugging
      const err = error as {
        response?: {
          status?: number;
          data?: { error?: { message?: string; code?: number; status?: string } };
        };
        message?: string;
      };
      const googleError = err.response?.data?.error;

      console.error('[validateAndroidPurchase] Error:', {
        message: err.message,
        googleApiStatus: err.response?.status,
        googleApiError: googleError?.message,
        googleApiCode: googleError?.code,
        googleApiStatusText: googleError?.status,
      });

      // Build base error response
      const errorResponse: ValidatePurchaseResponse = {
        valid: false,
        message: 'Failed to validate purchase',
      };

      // Include debug details only in non-production environments
      // Uses functions.config() for consistency with other config in this file
      const isProduction = functions.config().environment?.mode === 'production';
      if (!isProduction) {
        errorResponse.debug = {
          googleApiError: googleError?.message,
          googleApiCode: googleError?.code,
        };
      }

      res.status(500).json(errorResponse);
    }
  }
);
