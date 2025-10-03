import 'server-only';
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getENV } from './config';

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function init() {
  if (app) return app;
  const ENV = getENV();

  if (ENV.ADMIN_FAKE === '1') {
    console.log("Running in ADMIN_FAKE mode. Firebase Admin SDK not initialized.");
    return null;
  }

  if (getApps().length) {
    app = getApp();
  } else {
    // Resolve credentials from exactly one source
    let creds: any | null = null;
    if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) {
      const json = Buffer.from(ENV.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
      creds = JSON.parse(json);
    } else if (ENV.GOOGLE_APPLICATION_CREDENTIALS) {
      // ADC by file path; admin SDK will read it automatically
    } else if (ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
      creds = {
        projectId: ENV.FIREBASE_PROJECT_ID!,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL!,
        privateKey: ENV.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      };
    }

    app = initializeApp(creds ? { credential: cert(creds) } : {});
  }

  db = getFirestore(app);
  auth = getAuth(app);
  return app;
}

export function getAdminApp() {
  return init();
}
export function getAdminDb(): Firestore {
  init();
  if (!db) throw new Error('Admin DB not initialized');
  return db!;
}
export function getAdminAuth(): Auth {
  init();
  if (!auth) throw new Error('Admin Auth not initialized');
  return auth!;
}
