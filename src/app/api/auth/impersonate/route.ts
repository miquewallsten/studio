
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { getIdToken } from 'firebase/auth';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await requireAuth(request);
    
    // TODO: Resolve user role from a reliable source (e.g., Firestore) instead of just the token claim.
    requireRole(decodedToken.role, 'Super Admin');

    const { targetUid } = await request.json();
    
    // IMPORTANT: Only allow Super Admins to impersonate - This is now handled by requireRole
    // if (decodedToken.role !== 'Super Admin') {
    //   return NextResponse.json({ error: 'Forbidden. Only Super Admins can impersonate users.' }, { status: 403 });
    // }

    // Get the user we want to impersonate to retrieve their custom claims
    const targetUser = await adminAuth.getUser(targetUid);
    const impersonationClaims = targetUser.customClaims || {};

    // Create a custom token for the target user
    const customToken = await adminAuth.createCustomToken(targetUid, impersonationClaims);

    const response = NextResponse.json({ customToken });
    
    // We need the original token to switch back, so we have to get it from the header here.
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader ? authHeader.split('Bearer ')[1] : '';

    // Store the original user's UID in a cookie to allow "switching back"
    response.cookies.set('impersonatorUid', decodedToken.uid, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
    response.cookies.set('impersonatorToken', idToken, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });

    return response;

  } catch (error: any) {
    console.error('Error creating impersonation token:', error);
    let errorMessage = 'An unexpected error occurred during impersonation.';
     if (error.code === 'auth/user-not-found') {
        errorMessage = 'The user to be impersonated was not found.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
