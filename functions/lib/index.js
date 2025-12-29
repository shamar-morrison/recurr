"use strict";
/**
 * Firebase Cloud Function for validating Android in-app purchases
 *
 * This function verifies purchases with the Google Play Developer API
 * and updates the user's premium status in Firestore.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a service account in Google Cloud Console with Play Android Developer API access
 * 2. Download the JSON key file
 * 3. Set the GOOGLE_SERVICE_ACCOUNT environment variable:
 *    firebase functions:config:set google.service_account="$(cat service-account.json)"
 *
 * Or use a secret manager to store the credentials securely.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndroidPurchase = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const googleapis_1 = require("googleapis");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
/**
 * Validate an Android in-app purchase
 *
 * Verifies the purchase with Google Play and updates user's premium status
 */
exports.validateAndroidPurchase = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ valid: false, message: 'Method not allowed' });
        return;
    }
    try {
        const { userId, productId, purchaseToken, packageName } = req.body;
        // Validate required fields
        if (!userId || !productId || !purchaseToken || !packageName) {
            res.status(400).json({ valid: false, message: 'Missing required fields' });
            return;
        }
        console.log('[validateAndroidPurchase] Validating:', { userId, productId, packageName });
        // Get service account credentials from config or environment
        // You'll need to set this up with your actual service account
        const serviceAccountConfig = (_a = functions.config().google) === null || _a === void 0 ? void 0 : _a.service_account;
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
        }
        catch (_c) {
            console.error('[validateAndroidPurchase] Failed to parse service account');
            res.status(500).json({ valid: false, message: 'Server configuration error' });
            return;
        }
        // Create auth client
        const auth = new googleapis_1.google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        });
        const androidPublisher = googleapis_1.google.androidpublisher({
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
            });
            return;
        }
        // Check if already acknowledged
        if (purchase.acknowledgementState === 1) {
            // Purchase was already acknowledged, check if user is already premium
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.isPremium)) {
                res.json({
                    valid: true,
                    message: 'Purchase already validated',
                });
                return;
            }
        }
        // Acknowledge the purchase on Google's side
        await androidPublisher.purchases.products.acknowledge({
            packageName,
            productId,
            token: purchaseToken,
        });
        // Update user's premium status in Firestore
        await db
            .collection('users')
            .doc(userId)
            .update({
            isPremium: true,
            premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            premiumPurchase: {
                productId,
                purchaseToken,
                purchaseTime: purchase.purchaseTimeMillis,
                orderId: purchase.orderId,
                validatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
        });
        console.log('[validateAndroidPurchase] User updated:', userId);
        res.json({
            valid: true,
            message: 'Purchase validated successfully',
        });
    }
    catch (error) {
        console.error('[validateAndroidPurchase] Error:', error);
        res.status(500).json({
            valid: false,
            message: 'Failed to validate purchase',
        });
    }
});
//# sourceMappingURL=index.js.map