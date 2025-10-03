import 'server-only';
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getENV } from './config';

let app: App;
let auth: Auth;
let db: Firestore;

function initializeAdmin() {
  const ENV = getENV();
  if (getApps().length > 0) {
    app = getApp();
  } else {
    // In a test environment, you might use a mock or a different setup.
    // For this prototype, we'll assume ADMIN_FAKE is not for full-fledged testing of this module.
    if (ENV.ADMIN_FAKE === '1') {
      // This path should ideally not be taken in a real scenario where admin features are used.
      // We'll throw an error to make it clear that this is not a valid state for using admin functionality.
      throw new Error('Firebase Admin SDK cannot be initialized in ADMIN_FAKE mode. Disable it to use admin features.');
    }

    let creds: any | null = null;
    if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) {
      try {
        const json = Buffer.from(ENV.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
        creds = JSON.parse(json);
      } catch (e: any) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_B64: ${e.message}`);
      }
    } else if (ENV.GOOGLE_APPLICATION_CREDENTIALS) {
      // The SDK will automatically pick up the credentials from this environment variable.
      // We don't need to pass any credential object to initializeApp.
    } else if (ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
      creds = {
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }
    
    app = initializeApp(creds ? { credential: cert(creds) } : undefined);
  }

  auth = getAuth(app);
  db = getFirestore(app);
}

initializeAdmin();

export function getAdminApp(): App {
  return app;
}

export function getAdminDb(): Firestore {
  return db;
}

export function getAdminAuth(): Auth {
  return auth;
}
