
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { ENV } from '@/lib/config';
import { logger } from '@/lib/logger';
import { apiSafe } from '@/lib/api-safe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return apiSafe(async () => {
    checkRateLimit(request);
    const adminAuth = getAdminAuth();
    const decodedToken = await requireAuth(request);
    
    requireRole( (decodedToken as any).role || 'Unassigned', 'Super Admin');

    const { targetUid } = await request.json();
    if (!targetUid) {
      throw { status: 400, message: 'targetUid is required' };
    }

    const targetUser = await adminAuth.getUser(targetUid);
    const impersonationClaims = targetUser.customClaims || {};

    const customToken = await adminAuth.createCustomToken(targetUid, impersonationClaims);

    const response = NextResponse.json({ customToken });
    
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader ? authHeader.split('Bearer ')[1] : '';

    response.cookies.set('impersonatorUid', decodedToken.uid, { httpOnly: true, path: '/', secure: ENV.NODE_ENV === 'production' });
    response.cookies.set('impersonatorToken', idToken, { httpOnly: true, path: '/', secure: ENV.NODE_ENV === 'production' });
    
    logger.info('Impersonation started', { adminUid: decodedToken.uid, targetUid });

    return response;
  });
}
