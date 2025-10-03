// Server-only initializer. Never import from "use client".
if (typeof window !== 'undefined') { throw new Error('firebaseAdmin is server-only'); }
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function readServiceAccountFromB64() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_B64 environment variable. Please check your .env file.');
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch(e) {
    throw new Error('Could not parse FIREBASE_SERVICE_ACCOUNT_B64. Make sure it is a valid base64-encoded JSON string.');
  }
}

const sa = readServiceAccountFromB64();
const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
    }) });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
