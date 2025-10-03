import { getAdminAuth } from '@/lib/firebaseAdmin';
import { ENV } from './config';

export function getBearer(req: Request) {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

export async function requireAuth(req: Request) {
  const token = getBearer(req);
  if (!token && ENV.ADMIN_FAKE !== '1') throw new Error('Not authenticated: missing Bearer token');
  if (ENV.ADMIN_FAKE === '1') return { uid: 'fake-user', role: 'Super Admin' } as any;
  const adminAuth = getAdminAuth();
  return await adminAuth.verifyIdToken(token);
}
