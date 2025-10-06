import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import type { Role } from './rbac';

// --- helpers ---------------------------------------------------------------

function getBearerFromHeaders(req: NextRequest): string | null {
  // Standard Authorization: Bearer <token>
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }

  // Optional fallback: custom header some clients use during testing
  const x = req.headers.get('x-firebase-auth');
  if (x) return x.trim();

  // Optional: cookie called "Authorization" or "session" that holds just the token
  const cookieAuth = req.cookies.get('Authorization')?.value || req.cookies.get('session')?.value;
  if (cookieAuth) return cookieAuth.trim();

  return null;
}

// --- public API ------------------------------------------------------------

export async function requireAuth(req: NextRequest): Promise<DecodedIdToken & { role?: Role; tenantId?: string; email?: string }> {
  // IMPORTANT: we DO NOT read req.json() here (never touch the body)
  const token = getBearerFromHeaders(req);
  if (!token) {
    throw new Error('Missing bearer token');
  }

  const adminAuth = getAdminAuth();
  const decoded = await adminAuth.verifyIdToken(token, true);
  // Keep common fields handy for routes
  (decoded as any).email = decoded.email || decoded.firebase?.identities?.email?.[0];
  return decoded as any;
}

export function requireRole(actual: string | undefined, required: Role): void {
  if (!actual) {
    throw new Error('Missing role');
  }
  if (actual !== required && actual !== 'Platform Admin') {
    // Platform Admin can do everything
    throw new Error(`Requires role: ${required}`);
  }
}

// Simple wrapper so routes can throw and get JSON consistently
export async function apiSafe<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();
    return NextResponse.json(data ?? { ok: true });
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'Internal error';
    const status = /auth|role|missing|forbid|unauthor/i.test(msg) ? 401
                 : /not found/i.test(msg) ? 404
                 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
