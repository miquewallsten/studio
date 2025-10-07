import '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { hasAnyRole, mustTenant } from './rbac';
import type { Tool } from './types';

const COL_USERS   = 'users';
const COL_TICKETS = 'tickets';
const COL_TENANTS = 'tenants';

// QUERIES
export const countUsers: Tool = {
  id: 'count.users',
  kind: 'query',
  allow: (u) => hasAnyRole(u, ['Admin','Super Admin','Manager','Analyst','View Only','Tenant Admin']),
  tenantAware: true,
  run: async ({ user }) => {
    const db = getFirestore();
    if (user.tenantId) {
      const snap = await db.collection(COL_USERS).where('tenantId','==',user.tenantId).get();
      return { count: snap.size };
    }
    const snap = await db.collection(COL_USERS).get();
    return { count: snap.size };
  },
};

export const countTickets: Tool = {
  id: 'count.tickets',
  kind: 'query',
  allow: (u) => hasAnyRole(u, ['Admin','Super Admin','Manager','Analyst','Tenant Admin','Tenant User']),
  tenantAware: true,
  run: async ({ user }) => {
    const db = getFirestore();
    let q = db.collection(COL_TICKETS) as FirebaseFirestore.Query;
    if (user.tenantId) q = q.where('tenantId','==',user.tenantId);
    const snap = await q.get();
    return { count: snap.size };
  },
};

export const countTicketsSince: Tool = {
  id: 'count.ticketsSince',
  kind: 'query',
  allow: (u) => hasAnyRole(u, ['Admin','Super Admin','Manager','Analyst','Tenant Admin','Tenant User']),
  tenantAware: true,
  parse: (raw) => {
    const since = typeof raw?.since === 'string' ? new Date(raw.since) : new Date(NaN);
    if (isNaN(+since)) throw new Error('INVALID_SINCE');
    return { since };
  },
  run: async ({ user, input }) => {
    const db = getFirestore();
    let q = db.collection(COL_TICKETS)
      .where('createdAt','>=', input.since) as FirebaseFirestore.Query;
    if (user.tenantId) q = q.where('tenantId','==', user.tenantId);
    const snap = await q.get();
    return { count: snap.size };
  },
};

// ACTIONS
export const createTenant: Tool = {
  id: 'create.tenant',
  kind: 'action',
  allow: (u) => hasAnyRole(u, ['Super Admin','Admin']),
  parse: (raw) => {
    if (!raw?.name) throw new Error('NAME_REQUIRED');
    return { name: String(raw.name).trim() };
  },
  run: async ({ input }) => {
    const db = getFirestore();
    const ref = await db.collection(COL_TENANTS).add({
      name: input.name,
      createdAt: new Date().toISOString(),
    });
    return { tenantId: ref.id };
  },
};

export const createUser: Tool = {
  id: 'create.user',
  kind: 'action',
  allow: (u) => hasAnyRole(u, ['Admin','Super Admin','Tenant Admin']),
  parse: (raw) => {
    if (!raw?.email) throw new Error('EMAIL_REQUIRED');
    const role = raw?.role || 'Tenant User';
    return { email: String(raw.email).toLowerCase(), role };
  },
  run: async ({ user, input }) => {
    const db = getFirestore();
    const doc = {
      email: input.email,
      role: input.role,
      tenantId: user.tenantId ?? null,
      createdAt: new Date().toISOString(),
    };
    const ref = await db.collection(COL_USERS).add(doc);
    return { uid: ref.id, ...doc };
  },
};

export const addAnalystToTenant: Tool = {
  id: 'tenant.addAnalyst',
  kind: 'action',
  allow: (u) => hasAnyRole(u, ['Admin','Super Admin','Tenant Admin']),
  parse: (raw) => {
    if (!raw?.userId) throw new Error('USER_ID_REQUIRED');
    return { userId: String(raw.userId) };
  },
  run: async ({ user, input }) => {
    const db = getFirestore();
    const tenantId = mustTenant(user);
    const ref = db.collection(COL_USERS).doc(input.userId);
    await ref.set({ role: 'Analyst', tenantId }, { merge: true });
    return { ok: true };
  },
};

export const TOOLS: Tool[] = [
  countUsers, countTickets, countTicketsSince,
  createTenant, createUser, addAnalystToTenant,
];
