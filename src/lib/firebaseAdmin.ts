
import 'server-only';
import { initializeApp, getApps, getApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getENV } from './config';

let app: App;
let auth: Auth;
let db: Firestore;

// This function is the single source of truth for initializing the Admin SDK.
// It will only run once and subsequent calls will use the cached instances.
function initializeAdmin() {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    const ENV = getENV();
    
    if (ENV.ADMIN_FAKE === '1') {
      throw new Error('Firebase Admin SDK cannot be initialized in ADMIN_FAKE mode. Unset the ADMIN_FAKE environment variable.');
    }

    let serviceAccount: ServiceAccount | undefined;

    // The getENV() function has already validated that AT MOST one of these sources is present.
    if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) {
      try {
        const decoded = Buffer.from(ENV.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      } catch (e: any) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_B64: ${e.message}`);
      }
    } else if (ENV.GOOGLE_APPLICATION_CREDENTIALS) {
      // GOOGLE_APPLICATION_CREDENTIALS is a file path that the SDK reads automatically.
      // We don't need to parse it, but we let initializeApp handle it.
      // The SDK will throw an error if the file is not found or invalid.
    } else if (ENV.FIREBASE_PROJECT_ID) {
      // This is for the triplet of env vars.
       serviceAccount = {
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
    }
    
    // If a serviceAccount object was created, pass it. 
    // If not (i.e., GOOGLE_APPLICATION_CREDENTIALS is set, or we're using ADC), pass undefined.
    // The Firebase Admin SDK will automatically pick up credentials from the environment.
    app = initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : undefined);
  }

  // Once the app is initialized (either new or existing), get the db and auth instances.
  db = getFirestore(app);
  auth = getAuth(app);
}

// Initialize on module load. This ensures that any server-side code
// can reliably call getAdminDb/getAdminAuth. If this throws, the server will
// not start, which is the correct behavior for a critical configuration error.
try {
  initializeAdmin();
} catch (e: any) {
  // Log the error for visibility during server startup.
  console.error('CRITICAL: Firebase Admin SDK failed to initialize. This is a fatal error.', e);
  // Re-throw to ensure the process fails as expected.
  throw e;
}


export function getAdminApp(): App {
  if (!app) throw new Error('Admin App not initialized');
  return app;
}

export function getAdminDb(): Firestore {
  if (!db) throw new Error('Admin DB not initialized');
  return db;
}

export function getAdminAuth(): Auth {
  if (!auth) throw new Error('Admin Auth not initialized');
  return auth;
}
