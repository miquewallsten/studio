import { getAdminAuth } from '@/lib/firebaseAdmin';

export function getBearer(req: Request) {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

export async function requireAuth(req: Request) {
  const token = getBearer(req);
  if (!token && process.env.ADMIN_FAKE !== '1') throw new Error('Not authenticated: missing Bearer token');
  if (process.env.ADMIN_FAKE === '1') return { uid: 'fake-user' };
  const adminAuth = getAdminAuth();
  return await adminAuth.verifyIdToken(token);
}
