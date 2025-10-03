import "server-only";
import { initializeApp, getApps, getApp, App, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

function initAdmin(): App {
  if (adminApp) return adminApp;

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 missing. Provide base64-encoded serviceAccountKey.json in .env");
  }

  let creds: any;
  try {
    creds = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    if (!creds.project_id || !creds.client_email || !creds.private_key) {
      throw new Error("Decoded B64 JSON missing project_id/client_email/private_key");
    }
  } catch (e: any) {
    throw new Error(`Could not parse FIREBASE_SERVICE_ACCOUNT_B64: ${e.message}`);
  }

  adminApp = getApps().length ? getApp() : initializeApp({ credential: cert(creds) });
  return adminApp;
}

export function getAdminAuth() {
  return getAuth(initAdmin());
}

export function getAdminDb() {
    return getFirestore(initAdmin());
}
