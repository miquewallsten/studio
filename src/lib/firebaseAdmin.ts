
import "server-only";
import { initializeApp, getApps, cert, getApp, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { ENV } from "./config";

let adminApp: App | null = null;

function initializeAdmin() {
  if (getApps().length) {
    return getApp();
  }

  if (ENV.ADMIN_FAKE === '1') {
    // In a fake/test environment, we might not initialize a real app
    // or use emulators. For now, we'll just prevent crashes.
    console.log("Running in ADMIN_FAKE mode. Firebase Admin SDK not initialized.");
    return null;
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64 || b64 === 'PASTE_BASE64_OF_serviceAccountKey.json_HERE') {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 missing or is a placeholder. Provide base64-encoded serviceAccountKey.json in .env");
  }

  let creds;
  try {
    creds = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    if (!creds.project_id || !creds.client_email || !creds.private_key) {
      throw new Error("Decoded B64 JSON is not a valid service account. It's missing project_id, client_email, or private_key.");
    }
  } catch (e:any) {
    throw new Error(`Could not parse FIREBASE_SERVICE_ACCOUNT_B64: ${e.message}`);
  }

  return initializeApp({ credential: cert(creds) });
}

// Initialize on module load
adminApp = initializeAdmin();

export function getAdminAuth(): Auth {
  if (ENV.ADMIN_FAKE === '1') {
    // Provide a fake Auth object for testing/UI development if needed
    return {} as Auth;
  }
  if (!adminApp) {
    throw new Error("Firebase Admin App not initialized. Check server logs for credential errors.");
  }
  return getAuth(adminApp);
}

export function getAdminDb(): Firestore {
   if (ENV.ADMIN_FAKE === '1') {
    // Provide a fake DB object for testing/UI development if needed
    return {} as Firestore;
  }
  if (!adminApp) {
    throw new Error("Firebase Admin App not initialized. Check server logs for credential errors.");
  }
  return getFirestore(adminApp);
}
