// Server-only initializer. Never import from "use client".
if (typeof window !== 'undefined') { throw new Error('firebaseAdmin is server-only'); }

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccountFromB64() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 is missing');
  try {
    // Trim accidental whitespace/newlines
    const clean = b64.trim();
    // Decode
    const json = Buffer.from(clean, 'base64').toString('utf8');
    // Validate JSON
    const sa = JSON.parse(json);
    if (!sa.project_id || !sa.client_email || !sa.private_key) {
      throw new Error('Decoded JSON missing required fields (project_id, client_email, private_key)');
    }
    return sa;
  } catch (e: any) {
    throw new Error('Could not parse FIREBASE_SERVICE_ACCOUNT_B64. Make sure it is a valid base64-encoded JSON string. Inner: ' + String(e?.message || e));
  }
}

const sa = getServiceAccountFromB64();

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        // IMPORTANT: Replace literal "\\n" with actual newline characters
        privateKey: sa.private_key.replace(/\\n/g, '\n'),
      }),
    });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
