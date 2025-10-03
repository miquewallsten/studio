
import 'server-only';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let app: admin.app.App;

if (!admin.apps.length) {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

  if (!serviceAccountB64) {
    throw new Error('FATAL: FIREBASE_SERVICE_ACCOUNT_B64 is not set in the environment variables. The Admin SDK cannot be initialized.');
  }

  try {
    const serviceAccountJson = Buffer.from(serviceAccountB64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e: any) {
    throw new Error(`Failed to initialize Firebase Admin SDK. Check your FIREBASE_SERVICE_ACCOUNT_B64. Error: ${e.message}`);
  }
} else {
  app = admin.app();
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth, app as adminApp };
export const getAdminDb = () => adminDb;
export const getAdminAuth = () => adminAuth;
export const getAdminApp = () => app;
