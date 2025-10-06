
import 'server-only';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Role } from './rbac';

export interface AppDecodedIdToken extends DecodedIdToken {
    role: Role;
    tenantId?: string;
}

export function getBearer(req: Request): string | null {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function requireAuth(req: Request): Promise<AppDecodedIdToken> {
  const token = getBearer(req);
  
  if (process.env.ADMIN_FAKE === '1') {
      return { uid: 'fake-super-admin', role: 'Super Admin', tenantId: 'fake-tenant-id' } as AppDecodedIdToken;
  }
  
  if (!token) {
      const err = new Error('Unauthorized: missing Bearer token');
      (err as any).status = 401;
      throw err;
  }
  
  const adminAuth = getAdminAuth();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
        ...decodedToken,
        role: (decodedToken.role as Role) || 'Unassigned',
    } as AppDecodedIdToken;
  } catch (error: any) {
      let message = 'Invalid authentication token.';
      if (error.code === 'auth/id-token-expired') {
          message = 'Authentication token has expired. Please log in again.';
      }
      const err = new Error(message);
      (err as any).status = 401;
      (err as any).code = error.code;
      throw err;
  }
}
