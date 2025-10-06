import { App, getApp, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { ENV } from './config';

/**
 * Build service account creds from env:
 * 1) FIREBASE_SERVICE_ACCOUNT_B64 (preferred)
 * 2) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 */
function resolveServiceAccount(): { project_id: string; client_email: string; private_key: string } {
  if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) {
    const raw = Buffer.from(ENV.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
    const j = JSON.parse(raw);
    if (!j.project_id || !j.client_email || !j.private_key) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_B64 (missing required fields).');
    }
    return {
      project_id: j.project_id,
      client_email: j.client_email,
      private_key: (j.private_key as string).replace(/\\n/g, '\n'),
    };
  }

  if (ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: ENV.FIREBASE_PROJECT_ID,
      client_email: ENV.FIREBASE_CLIENT_EMAIL,
      private_key: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  throw new Error('Firebase Admin credentials not provided. Set FIREBASE_SERVICE_ACCOUNT_B64 or the project/email/key triplet.');
}

function initializeAdmin(): App {
  if (getApps().length) return getApp();
  const svc = resolveServiceAccount();
  return initializeApp({
    credential: cert({
      projectId: svc.project_id,
      clientEmail: svc.client_email,
      privateKey: svc.private_key,
    }),
  });
}

export function getAdminApp(): App {
  return initializeAdmin();
}

export function getAdminAuth(): Auth {
  return getAuth(initializeAdmin());
}

export function getAdminStorage(): Storage {
  return getStorage(initializeAdmin());
}

export function getAdminDb(): Firestore {
  return getFirestore(initializeAdmin());
}
