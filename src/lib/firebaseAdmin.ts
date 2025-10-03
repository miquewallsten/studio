// Server-only; never import from "use client".
if (typeof window !== 'undefined') throw new Error('firebaseAdmin is server-only');

import fs from 'node:fs';
import path from 'node:path';
import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ENV } from './config';

const ADMIN_FAKE = ENV.ADMIN_FAKE === '1';

function normalizePem(pemRaw: string) {
  let pk = String(pemRaw || '');
  pk = pk.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
  if (!pk.startsWith('-----BEGIN PRIVATE KEY-----')) pk = '-----BEGIN PRIVATE KEY-----\n' + pk;
  if (!pk.endsWith('-----END PRIVATE KEY-----')) pk = pk + '\n-----END PRIVATE KEY-----';
  if (!pk.endsWith('\n')) pk += '\n';
  return pk;
}

function getServiceAccount() {
  const credPath = ENV.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const abs = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
    if (!fs.existsSync(abs)) throw new Error(`Credential file not found at ${abs}`);
    const json = fs.readFileSync(abs, 'utf8').trim().replace(/^\uFEFF/, '');
    const sa = JSON.parse(json);
    return { project_id: sa.project_id, client_email: sa.client_email, private_key: normalizePem(sa.private_key) };
  }

  const b64 = ENV.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    const json = Buffer.from(b64.trim(), 'base64').toString('utf8').trim().replace(/^\uFEFF/, '');
    const unwrapped = (json.startsWith('"') && json.endsWith('"')) ? json.slice(1, -1) : json;
    const sa = JSON.parse(unwrapped);
    return { project_id: sa.project_id, client_email: sa.client_email, private_key: normalizePem(sa.private_key) };
  }

  const projectId = ENV.FIREBASE_PROJECT_ID;
  const clientEmail = ENV.FIREBASE_CLIENT_EMAIL;
  const rawKey = ENV.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && rawKey) {
    return { project_id: projectId, client_email: clientEmail, private_key: normalizePem(rawKey) };
  }

  return null;
}

function ensureApp() {
  if (getApps().length) return;
  if (ADMIN_FAKE) return; // no real init in fake mode
  const sa = getServiceAccount();
  if (sa) {
    initializeApp({ credential: cert({ projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key }) });
  } else {
    initializeApp({ credential: applicationDefault() });
  }
}

export function getAdminAuth() {
  if (ADMIN_FAKE) {
    return {
      async listUsers() { return { users: [] }; },
      async verifyIdToken() { return { uid: 'fake-user' }; },
    } as any;
  }
  ensureApp();
  return getAuth();
}

export function getAdminDb() {
  if (ADMIN_FAKE) {
    return { collection: () => ({ doc: () => ({ get: async()=>({ exists:false }), set: async()=>{}, update: async()=>{} }), get: async()=>({ forEach:()=>{} }) }) } as any;
  }
  ensureApp();
  return getFirestore();
}
