import admin from 'firebase-admin';
import { ENV } from './config';

if (!admin.apps.length) {
  let cred: admin.credential.Credential;

  if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      const json = Buffer.from(ENV.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
      const svc = JSON.parse(json);
      cred = admin.credential.cert({
        projectId: svc.project_id,
        clientEmail: svc.client_email,
        privateKey: svc.private_key?.replace(/\\n/g, '\n'),
      });
    } catch (e) {
      console.warn('[firebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_B64, falling back to ADC.', e);
      cred = admin.credential.applicationDefault();
    }
  } else {
    // Application Default Credentials (works on GCP and local if gcloud auth application-default login)
    cred = admin.credential.applicationDefault();
  }

  admin.initializeApp({ credential: cred });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
