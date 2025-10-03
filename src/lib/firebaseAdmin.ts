// Server-only; never import from "use client".
if (typeof window !== 'undefined') throw new Error('firebaseAdmin is server-only');

import fs from 'node:fs';
import path from 'node:path';
import { getApps, initializeApp, applicationDefault, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_FAKE = process.env.ADMIN_FAKE === '1';

// @ts-ignore augment global to keep a single instance across hot reload
declare global { var __ADMIN_APP__: ReturnType<typeof initializeApp> | undefined }

function normalizePem(pemRaw: string) {
  let pk = String(pemRaw || '');
  pk = pk.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
  if (!pk.startsWith('-----BEGIN PRIVATE KEY-----')) pk = '-----BEGIN PRIVATE KEY-----\n' + pk;
  if (!pk.endsWith('-----END PRIVATE KEY-----')) pk = pk + '\n-----END PRIVATE KEY-----';
  if (!pk.endsWith('\n')) pk += '\n';
  return pk;
}

function getServiceAccount() {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const abs = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
    if (!fs.existsSync(abs)) throw new Error(`Credential file not found at ${abs}`);
    const json = fs.readFileSync(abs, 'utf8').trim().replace(/^\uFEFF/, '');
    const sa = JSON.parse(json);
    return { project_id: sa.project_id, client_email: sa.client_email, private_key: normalizePem(sa.private_key) };
  }
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    const json = Buffer.from(b64.trim(), 'base64').toString('utf8').trim().replace(/^\uFEFF/, '');
    const unwrapped = (json.startsWith('"') && json.endsWith('"')) ? json.slice(1, -1) : json;
    const sa = JSON.parse(unwrapped);
    return { project_id: sa.project_id, client_email: sa.client_email, private_key: normalizePem(sa.private_key) };
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && rawKey) {
    return { project_id: projectId, client_email: clientEmail, private_key: normalizePem(rawKey) };
  }
  return null;
}

function ensureSingleApp() {
  if (ADMIN_FAKE) return;
  if (global.__ADMIN_APP__) return; // cached
  if (getApps().length) { global.__ADMIN_APP__ = getApp(); return; }

  const sa = getServiceAccount();
  if (sa) {
    global.__ADMIN_APP__ = initializeApp({ credential: cert({
      projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key,
    })});
  } else {
    global.__ADMIN_APP__ = initializeApp({ credential: applicationDefault() });
  }
}

export function getAdminAuth() {
  if (ADMIN_FAKE) {
    return { async listUsers(){return{users:[]}}, async verifyIdToken(){return{uid:'fake-user'}} } as any;
  }
  ensureSingleApp();
  return getAuth();
}

export function getAdminDb() {
  if (ADMIN_FAKE) {
    return { collection: () => ({ doc: () => ({ get: async()=>({exists:false}), set: async()=>{}, update: async()=>{} }), get: async()=>({ forEach:()=>{} }) }) } as any;
  }
  ensureSingleApp();
  return getFirestore();
}
