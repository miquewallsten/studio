
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { ENV } from '@/lib/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    checkRateLimit(request);
    const adminAuth = getAdminAuth();
    const decodedToken = await requireAuth(request);
    
    requireRole( (decodedToken as any).role || 'Unassigned', 'Super Admin');

    const { targetUid } = await request.json();
    if (!targetUid) {
      return NextResponse.json({ error: 'targetUid is required' }, { status: 400 });
    }

    // Get the user we want to impersonate to retrieve their custom claims
    const targetUser = await adminAuth.getUser(targetUid);
    const impersonationClaims = targetUser.customClaims || {};

    // Create a custom token for the target user
    const customToken = await adminAuth.createCustomToken(targetUid, impersonationClaims);

    const response = NextResponse.json({ customToken });
    
    // We need the original token to switch back, so we have to get it from the header here.
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader ? authHeader.split('Bearer ')[1] : '';

    // Store the original user's UID and token in secure, httpOnly cookies
    response.cookies.set('impersonatorUid', decodedToken.uid, { httpOnly: true, path: '/', secure: ENV.NODE_ENV === 'production' });
    response.cookies.set('impersonatorToken', idToken, { httpOnly: true, path: '/', secure: ENV.NODE_ENV === 'production' });
    
    logger.info('Impersonation started', { adminUid: decodedToken.uid, targetUid });

    return response;

  } catch (error: any) {
    logger.error('Error creating impersonation token:', { error: error.message });
    let errorMessage = 'An unexpected error occurred during impersonation.';
     if (error.code === 'auth/user-not-found') {
        errorMessage = 'The user to be impersonated was not found.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: error.status || 500 });
  }
}
