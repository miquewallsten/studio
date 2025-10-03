
import 'server-only';
import { initializeApp, getApps, getApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getENV } from './config';

let app: App;
let auth: Auth;
let db: Firestore;

function initializeAdmin() {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    const ENV = getENV();
    
    // This mode is for local testing and should not be used with real credentials.
    // We explicitly disable it here to avoid confusion.
    if (ENV.ADMIN_FAKE === '1') {
      throw new Error('Firebase Admin SDK cannot be initialized in ADMIN_FAKE mode. Unset the ADMIN_FAKE environment variable.');
    }

    let serviceAccount: ServiceAccount | undefined;

    // The getENV() function has already validated that exactly one of these sources is present.
    if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) {
      try {
        const decoded = Buffer.from(ENV.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      } catch (e: any) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_B64: ${e.message}`);
      }
    } else if (ENV.GOOGLE_APPLICATION_CREDENTIALS) {
      // GOOGLE_APPLICATION_CREDENTIALS is a file path that the SDK reads automatically.
      // We don't need to parse it, but we pass it to initializeApp.
      // In a deployed environment, this is often set automatically.
      // For local, it would be a path to a service account JSON file.
    } else if (ENV.FIREBASE_PROJECT_ID) {
      // This is for the triplet of env vars.
       serviceAccount = {
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
    }
    
    // We must have one valid credential source as per getENV validation
    app = initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : undefined);
  }

  auth = getAuth(app);
  db = getFirestore(app);
}

// Initialize on module load, this will throw an error if config is bad
try {
  initializeAdmin();
} catch (e: any) {
  // We log this here to make server startup failures more obvious in the console
  console.error('CRITICAL: Firebase Admin SDK failed to initialize. This is a fatal error.', e);
  // We don't re-throw here, because the error will already have been thrown by getENV() or initializeApp().
  // This just makes sure it's visible in logs.
}


export function getAdminApp(): App {
  if (!app) initializeAdmin();
  return app;
}

export function getAdminDb(): Firestore {
  if (!db) initializeAdmin();
  return db;
}

export function getAdminAuth(): Auth {
  if (!auth) initializeAdmin();
  return auth;
}
