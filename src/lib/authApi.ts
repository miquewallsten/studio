
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import type { Role } from './rbac';
import { logger } from './logger';

// --- helpers ---------------------------------------------------------------

function getBearerFromHeaders(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// --- public API ------------------------------------------------------------

export async function requireAuth(req: NextRequest): Promise<DecodedIdToken & { role?: Role; tenantId?: string; email?: string }> {
  const token = getBearerFromHeaders(req);
  if (!token) {
    logger.warn('requireAuth: Missing bearer token');
    throw new Error('Unauthorized: Missing bearer token');
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token, true); // checkRevoked = true
    
    const augmentedToken = decoded as DecodedIdToken & { role?: Role; tenantId?: string; email?: string };
    augmentedToken.role = (decoded.role as Role) || 'Unassigned';
    augmentedToken.tenantId = decoded.tenantId as string | undefined;
    augmentedToken.email = decoded.email || (decoded.firebase?.identities?.email?.[0] as string | undefined);
    
    return augmentedToken;
  } catch (error: any) {
    logger.warn('requireAuth: Token verification failed', { code: error.code, message: error.message });
    if (error.code === 'auth/id-token-revoked') {
      throw new Error('Unauthorized: Token has been revoked.');
    }
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Unauthorized: Token has expired.');
    }
    throw new Error('Unauthorized: Invalid token.');
  }
}
