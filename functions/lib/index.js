"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndroidPurchase = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const googleapis_1 = require("googleapis");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// Allowed origins for CORS (configure via firebase functions:config:set)
// Default to empty array which will reject all cross-origin requests
const getAllowedOrigins = () => {
    var _a;
    const originsConfig = (_a = functions.config().cors) === null || _a === void 0 ? void 0 : _a.allowed_origins;
    if (!originsConfig) {
        // In development, you might want to allow localhost
        return ['http://localhost:8081', 'http://localhost:19006'];
    }
    return originsConfig.split(',').map((o) => o.trim());
};
/**
 * Verify Firebase Auth token from request
 * Returns the decoded token if valid, null otherwise
 */
async function verifyAuthToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    }
    catch (error) {
        console.error('[verifyAuthToken] Token verification failed:', error);
        return null;
    }
}
/**
 * Handle CORS with origin whitelist
 */
function handleCors(req, res) {
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
exports.validateAndroidPurchase = functions.https.onRequest(async (req, res) => {
    var _a, _b;
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
        });
        return;
    }
    try {
        const { userId, productId, purchaseToken, packageName } = req.body;
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
            });
            return;
        }
        console.log('[validateAndroidPurchase] Validating:', {
            userId,
            productId,
            packageName,
        });
        // Get service account credentials from config or environment
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