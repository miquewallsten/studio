import { getAdminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getIdToken } from 'firebase/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Not authenticated. No auth header.' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];

    const { targetUid } = await request.json();
    
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // IMPORTANT: Only allow Super Admins to impersonate
    if (decodedToken.role !== 'Super Admin') {
      return NextResponse.json({ error: 'Forbidden. Only Super Admins can impersonate users.' }, { status: 403 });
    }

    // Get the user we want to impersonate to retrieve their custom claims
    const targetUser = await adminAuth.getUser(targetUid);
    const impersonationClaims = targetUser.customClaims || {};

    // Create a custom token for the target user
    const customToken = await adminAuth.createCustomToken(targetUid, impersonationClaims);

    const response = NextResponse.json({ customToken });
    
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
