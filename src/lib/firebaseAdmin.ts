
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
    
    if (ENV.ADMIN_FAKE === '1') {
      throw new Error('Firebase Admin SDK cannot be initialized in ADMIN_FAKE mode.');
    }

    let serviceAccount: ServiceAccount | undefined;

    if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) {
      try {
        const decoded = Buffer.from(ENV.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      } catch (e: any) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_B64: ${e.message}`);
      }
    } else if (ENV.FIREBASE_PROJECT_ID) {
      // This is for the triplet, GOOGLE_APPLICATION_CREDENTIALS is handled by the SDK automatically
       serviceAccount = {
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
    }
    
    app = initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : undefined);
  }

  auth = getAuth(app);
  db = getFirestore(app);
}

// Initialize on module load
initializeAdmin();


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
