
// Server-only. Never import from "use client".
import fs from 'node:fs';
import path from 'node:path';
import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';


function readServiceAccountFromAnySource() {
  // 1) Base64 full JSON
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    try {
      const json = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(json);
    } catch (e) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_B64 is not valid base64 JSON: ${String(e)}`);
    }
  }

  // 2) File path (GOOGLE_APPLICATION_CREDENTIALS)
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const abs = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
    if (!fs.existsSync(abs)) {
      throw new Error(`Firebase admin initialization error: Failed to read credentials from file ${abs}: Error: ENOENT: no such file or directory, open '${abs}'.`);
    }
    try {
      return JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch (e) {
      throw new Error(`Failed to read credentials from file ${abs}: ${String(e)}`);
    }
  }

  // 3) Individual env vars (projectId/email/privateKey)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && rawKey) {
    // Turn literal "\n" sequences back into newlines
    const privateKey = rawKey.replace(/\\n/g, '\n');
    return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
  }

  return null;
}

let app;
if (getApps().length) {
  app = getApps()[0];
} else {
    try {
        const sa = readServiceAccountFromAnySource();
        if (sa) {
            // If we have a parsed service account (from b64/file/env trio), use cert()
            app = initializeApp({
            credential: cert({
                projectId: (sa as any).project_id,
                clientEmail: (sa as any).client_email,
                privateKey: (sa as any).private_key,
            }),
            });
        } else {
            // Fallback: try applicationDefault() which works if the host environment is already configured.
            // This will throw if no credentials can be found.
            app = initializeApp({ credential: applicationDefault() });
        }
    } catch (error: any) {
         // Re-throw a more user-friendly error to be caught by the UI
        let errorMessage = error.message;
        if (error.code === 'ENOENT' || error.message.includes('ENOENT')) {
            errorMessage = `Firebase admin initialization error: Failed to read credentials from file ${process.env.GOOGLE_APPLICATION_CREDENTIALS}: ${error.message}`;
        } else if (error.message.includes('Invalid PEM formatted message')) {
            errorMessage = `Firebase admin initialization error: Failed to parse private key: Error: Invalid PEM formatted message.`
        } else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_B64 && !process.env.FIREBASE_PROJECT_ID) {
            errorMessage = 'Firebase Admin SDK credential error: Please ensure your service account credentials are set correctly in your environment.';
        }
        throw new Error(errorMessage);
    }
}

// Lazily initialize and get the auth instance
export const getAdminAuth = () => {
    if (!app) throw new Error("Firebase Admin SDK not initialized.");
    return getAuth(app);
};

// Lazily initialize and get the firestore instance
export const getAdminDb = () => {
    if (!app) throw new Error("Firebase Admin SDK not initialized.");
    return getFirestore(app);
};
