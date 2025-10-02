
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Predefined roles
const VALID_ROLES = ['Admin', 'Analyst', 'Manager', 'View Only', 'Super Admin', 'Tenant Admin', 'Tenant User', 'End User'];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const { email, role, tenantId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!role && !tenantId) {
        return NextResponse.json({ error: 'Either a role or a tenantId must be provided.' }, { status: 400 });
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 });
    }
    
    // Security check: Only Super Admins can create internal roles.
    // Tenant Admins can only create roles within their own tenant.
    if (decodedToken.role !== 'Super Admin' && !tenantId) {
        return NextResponse.json({ error: 'Forbidden. You can only invite users to a tenant.' }, { status: 403 });
    }
    
    // Security check: If tenantId is provided, ensure the caller is an admin of that tenant.
    if (tenantId && decodedToken.tenantId !== tenantId && decodedToken.role !== 'Super Admin') {
        return NextResponse.json({ error: 'Forbidden. You cannot invite users to this tenant.' }, { status: 403 });
    }


    // Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      emailVerified: false, // User will verify their email later
    });
    
    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    const customClaims: {[key: string]: string} = {};
    const userProfile: {[key: string]: any} = {
        email: userRecord.email,
        role: role,
    };

    if (role) {
        customClaims.role = role;
    }
    if (tenantId) {
        customClaims.tenantId = tenantId;
        userProfile.tenantId = tenantId;
        // If a tenantId is provided and no specific tenant role is assigned, default to Tenant User
        if (!role || (role !== 'Tenant Admin' && role !== 'End User')) {
            customClaims.role = 'End User';
            userProfile.role = 'End User';
        }
    }

    // Set custom claims for the role/tenant
    await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);
    
    // Create a user profile document
    const userRef = adminDb.collection('users').doc(userRecord.uid);
    batch.set(userRef, userProfile);
    
    await batch.commit();

    return NextResponse.json({ uid: userRecord.uid, email: userRecord.email, claims: customClaims });

  } catch (error: any) {
    console.error('Error creating user:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'A user with this email address already exists.';
    } else if (error.code === 'app/invalid-credential' || error.message.includes('credential')) {
        errorMessage = 'Firebase Admin SDK credential error.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
