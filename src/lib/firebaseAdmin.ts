// Server-only; never import from "use client".
if (typeof window !== 'undefined') throw new Error('firebaseAdmin is server-only');

import { getApps, initializeApp, applicationDefault, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ENV } from './config';
import { logger } from './logger';

// @ts-ignore augment global to keep a single instance across hot reload
declare global { var __ADMIN_APP__: ReturnType<typeof initializeApp> | undefined }

function normalizePem(pemRaw: string): string {
  let pk = String(pemRaw || '');
  pk = pk.replace(/\\n/g, '\n').trim();
  if (!pk.startsWith('-----BEGIN PRIVATE KEY-----')) pk = '-----BEGIN PRIVATE KEY-----\n' + pk;
  if (!pk.endsWith('-----END PRIVATE KEY-----')) pk = pk + '\n-----END PRIVATE KEY-----';
  if (!pk.endsWith('\n')) pk += '\n';
  return pk;
}

function getServiceAccount() {
  // B64 is the preferred method for Vercel/serverless
  if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      const json = Buffer.from(ENV.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
      const sa = JSON.parse(json);
      sa.private_key = normalizePem(sa.private_key);
      logger.debug('Loaded Firebase credentials from FIREBASE_SERVICE_ACCOUNT_B64');
      return sa;
    } catch (e) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_B64', { error: (e as Error).message });
      return null;
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
      project_id: ENV.FIREBASE_PROJECT_ID,
      client_email: ENV.FIREBASE_CLIENT_EMAIL,
      private_key: normalizePem(ENV.FIREBASE_PRIVATE_KEY),
    };
  }

  logger.warn('No explicit Firebase credentials found, falling back to Application Default Credentials (ADC)');
  return null;
}

function ensureSingleApp() {
  if (ENV.ADMIN_FAKE === '1') return;
  if (global.__ADMIN_APP__) return global.__ADMIN_APP__;
  if (getApps().length) { 
    global.__ADMIN_APP__ = getApp(); 
    return global.__ADMIN_APP__;
  }

  const credentialSource = getServiceAccount();

  if (credentialSource) {
    global.__ADMIN_APP__ = initializeApp({ credential: cert(credentialSource) });
  } else {
    // If no explicit credentials, try ADC. This is useful for some cloud environments.
    global.__ADMIN_APP__ = initializeApp({ credential: applicationDefault() });
  }
  return global.__ADMIN_APP__;
}

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
  ensureSingleApp();
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
  ensureSingleApp();
  return getFirestore();
}
