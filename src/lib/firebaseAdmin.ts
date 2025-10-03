// Server-only; never import from "use client".
if (typeof window !== 'undefined') throw new Error('firebaseAdmin is server-only');

import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { ENV } from './config';
import { logger } from './logger';
import { assertSingleInstance } from "./instanceGuard";

// @ts-ignore augment global to keep a single instance across hot reload
declare global { var __ADMIN_APP__: ReturnType<typeof initializeApp> | undefined }

function getServiceAccount() {
  // B64 is the preferred method for Vercel/serverless
  if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      const json = Buffer.from(ENV.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
      const sa = JSON.parse(json);
      if (!sa.private_key) {
        throw new Error("private_key is missing from service account JSON");
      }
      // This is the critical fix: ensure newline characters are correctly formatted.
      sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      logger.debug('Loaded Firebase credentials from FIREBASE_SERVICE_ACCOUNT_B64');
      return sa;
    } catch (e: any) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_B64', { error: e.message });
      throw new Error(`Could not parse FIREBASE_SERVICE_ACCOUNT_B64: ${e.message}`);
    }
  }

  // File path is mostly for local dev
  if (ENV.GOOGLE_APPLICATION_CREDENTIALS) {
    logger.debug('Trying to load Firebase credentials from GOOGLE_APPLICATION_CREDENTIALS');
    // The `cert` function will handle reading this file path.
    return ENV.GOOGLE_APPLICATION_CREDENTIALS;
  }
  
  // Triplet is a fallback
  if (ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
     logger.debug('Loaded Firebase credentials from triplet env vars');
    return {
      projectId: ENV.FIREBASE_PROJECT_ID,
      clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
      privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  logger.warn('No explicit Firebase credentials found, falling back to Application Default Credentials (ADC)');
  return null; // Will use ADC
}

function initializeAdminApp() {
  if (ENV.ADMIN_FAKE === '1') return;
  assertSingleInstance();

  if (global.__ADMIN_APP__) {
    return global.__ADMIN_APP__;
  }

  if (getApps().length > 0) {
    global.__ADMIN_APP__ = getApp();
    return global.__ADMIN_APP__;
  }

  const credential = getServiceAccount();

  if (credential) {
    global.__ADMIN_APP__ = initializeApp({ credential: cert(credential) });
  } else {
    // If no explicit credentials, try ADC. This is useful for some cloud environments.
    try {
        global.__ADMIN_APP__ = initializeApp();
    } catch (e: any) {
        logger.error('Firebase Admin SDK initialization failed with ADC.', { error: e.message });
        // Don't throw here, let health checks report the failure.
    }
  }
  return global.__ADMIN_APP__;
}

initializeAdminApp();

export function getAdminAuth() {
  if (ENV.ADMIN_FAKE === '1') {
    logger.warn('Using fake Firebase Admin Auth instance');
    return { 
      listUsers: async () => ({ users: [] }), 
      verifyIdToken: async () => ({ uid: 'fake-super-admin', role: 'Super Admin' }),
      getUser: async (uid: string) => ({ uid, customClaims: { role: 'Super Admin'} }),
      createCustomToken: async (uid: string) => `fake-token-for-${uid}`,
      setCustomUserClaims: async () => {},
      createUser: async (props: any) => ({ uid: `fake-${props.email}`}),
      getUserByEmail: async (email: string) => ({ uid: `fake-${email}` }),
      generatePasswordResetLink: async (email: string) => `http://localhost:9002/onboard?oobCode=fake-code-for-${email}`,
      deleteUser: async () => {},
     } as any;
  }
  if (!getApps().length) {
    throw new Error("Firebase Admin SDK has not been initialized. Check your credentials and server logs.");
  }
  return getAuth();
}

export function getAdminDb() {
  if (ENV.ADMIN_FAKE === '1') {
    logger.warn('Using fake Firebase Admin Firestore instance');
    return { 
        collection: () => ({ 
            doc: () => ({ 
                get: async () => ({ exists: false, data: () => null }), 
                set: async () => {}, 
                update: async () => {},
                delete: async () => {},
                collection: () => ({
                    doc: () => ({
                         get: async () => ({ exists: false, data: () => null }), 
                         set: async () => {}, 
                    })
                })
            }), 
            add: async () => ({ id: 'fake-id' }),
            where: () => ({ 
                get: async () => ({ empty: true, docs: [], forEach: () => {} }),
                limit: () => ({
                     get: async () => ({ empty: true, docs: [], forEach: () => {} }),
                })
             }),
            get: async () => ({ empty: true, docs: [], forEach: () => {} }),
            orderBy: () => ({ 
                get: async () => ({ empty: true, docs: [], forEach: () => {} }),
                limit: () => ({
                     get: async () => ({ empty: true, docs: [], forEach: () => {} }),
                })
            })
        }),
        batch: () => ({
            set: () => {},
            update: () => {},
            delete: () => {},
            commit: async () => {},
        })
    } as any;
  }
  if (!getApps().length) {
    throw new Error("Firebase Admin SDK has not been initialized. Check your credentials and server logs.");
  }
  return getFirestore();
}
