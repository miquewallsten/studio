import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import '@/lib/firebaseAdmin'; // ensure admin SDK is initialized

import type { Role } from '@/lib/ai-bus/types';

export type Decoded = {
  uid: string;
  email?: string;
  role?: Role;
  tenantId?: string;
};

function fromAdminToken(decoded: any): Decoded {
  return {
    uid: decoded?.uid,
    email: decoded?.email,
    role: (decoded as any)?.role,
    tenantId: (decoded as any)?.tenantId,
  };
}

async function tryAuthHeader(req: NextRequest): Promise<Decoded | null> {
  const authz = req.headers.get('authorization');
  if (!authz?.startsWith('Bearer ')) return null;
  const token = authz.slice('Bearer '.length).trim();
  const decoded = await getAuth().verifyIdToken(token);
  return fromAdminToken(decoded);
}

async function tryCookie(): Promise<Decoded | null> {
  try {
    const store = await (cookies() as any); // Next 15 headers API is sync
    const token =
      store.get('token')?.value ||
      store.get('session')?.value ||
      store.get('__session')?.value;
    if (!token) return null;
    const decoded = await getAuth().verifyIdToken(token);
    return fromAdminToken(decoded);
  } catch {
    return null;
  }
}

// Dev-only headers to impersonate in local/testing without real Firebase tokens
function tryDevHeaders(req: NextRequest): Decoded | null {
  const uid = req.headers.get('x-debug-uid');
  if (!uid) return null;
  const role = req.headers.get('x-debug-role') as Role | null;
  const email = req.headers.get('x-debug-email') || undefined;
  const tenantId = req.headers.get('x-debug-tenant') || undefined;
  return { uid, email, role: role || 'Unassigned', tenantId };
}

export async function requireAuth(req: NextRequest): Promise<Decoded> {
  const viaHeader = await tryAuthHeader(req);
  if (viaHeader) return viaHeader;

  const viaCookie = await tryCookie();
  if (viaCookie) return viaCookie;

  const viaDev = tryDevHeaders(req);
  if (viaDev) return viaDev;

  throw new Error('Unauthorized');
}

export function requireRole(role: Role | undefined, ...allowed: Role[]) {
  if (!role) throw new Error('Forbidden');
  if (!allowed.includes(role)) throw new Error('Forbidden');
}

export function requireAnyRole(role: Role | undefined, allowed: Role[]) {
  return requireRole(role, ...allowed);
}
