import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import type { Role } from '@/lib/ai-bus/types';
import { adminAuth } from '@/lib/firebaseAdmin';

export type Decoded = {
  uid: string;
  email?: string;
  role?: Role;
  tenantId?: string;
};

/**
 * Accepts debug headers for local testing:
 *   x-debug-uid, x-debug-role, x-debug-tenant
 * Falls back to verifying a Firebase session token from cookies.
 */
export async function requireAuth(req: NextRequest): Promise<Decoded> {
  // Debug headers for local/dev smoke tests
  const dbgUid = req.headers.get('x-debug-uid');
  if (dbgUid) {
    const role = (req.headers.get('x-debug-role') as Role | null) ?? 'Super Admin';
    const tenantId = req.headers.get('x-debug-tenant') ?? undefined;
    return { uid: dbgUid, role, tenantId };
  }

  // Cookie-based session
  // On some setups cookies() returns a Promise — normalize with await.
  const jar: any = await (cookies() as any);
  const token =
    jar.get?.('token')?.value ||
    jar.get?.('session')?.value ||
    jar.get?.('__session')?.value;

  if (!token) throw new Error('UNAUTHENTICATED');

  const decoded = await adminAuth.verifyIdToken(token);
  const role = (decoded as any)?.role as Role | undefined;
  const tenantId = (decoded as any)?.tenantId as string | undefined;

  return { uid: decoded.uid, email: decoded.email, role, tenantId };
}

export function requireRole(role: Role | undefined, ...allowed: Role[]) {
  if (!role) throw new Error('FORBIDDEN');
  if (!allowed.includes(role)) throw new Error('FORBIDDEN');
}
