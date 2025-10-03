
import 'server-only';
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

let app: admin.app.App;

function getCredential(): admin.ServiceAccount {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

    if (!b64) {
        // If B64 is not set, we assume Application Default Credentials (ADC) in a deployed environment.
        // initializeApp() with no arguments will automatically use ADC.
        console.log("FIREBASE_SERVICE_ACCOUNT_B64 not set, attempting to use Application Default Credentials.");
        return {}; // Return empty object, which is not a valid credential type but signals to use ADC
    }

    try {
        // First, try to decode it as Base64. This is the expected format.
        const decodedJson = Buffer.from(b64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decodedJson);
        console.log("Successfully parsed FIREBASE_SERVICE_ACCOUNT_B64 as a Base64-encoded JSON string.");
        return serviceAccount;
    } catch (e1) {
        // If Base64 decoding or parsing fails, it might be a raw JSON string.
        try {
            const serviceAccount = JSON.parse(b64);
            // This case is common if the raw JSON from the file is pasted into the env var.
            console.log("Parsed FIREBASE_SERVICE_ACCOUNT_B64 as a raw JSON string.");
            return serviceAccount;
        } catch (e2) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_B64 as Base64:", (e1 as Error).message);
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_B64 as raw JSON:", (e2 as Error).message);
            throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 is present but could not be parsed. It must be a valid JSON string or a Base64 encoding of one.");
        }
    }
}

if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK...");
    const credentialInput = getCredential();
    
    // Check if we are using ADC (signaled by empty credential object)
    if (Object.keys(credentialInput).length === 0) {
         app = admin.initializeApp();
    } else {
         app = admin.initializeApp({
            credential: admin.credential.cert(credentialInput),
        });
    }
     console.log("Firebase Admin SDK initialized successfully.");
} else {
    app = admin.app();
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth, app as adminApp };

export const getAdminDb = () => adminDb;
export const getAdminAuth = () => adminAuth;
export const getAdminApp = () => app;
