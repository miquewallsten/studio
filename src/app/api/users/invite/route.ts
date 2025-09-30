
import { getAdminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Predefined roles
const VALID_ROLES = ['Admin', 'Analyst', 'Manager', 'View Only'];

export async function POST(request: NextRequest) {
  try {
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

    const adminAuth = getAdminAuth();

    // Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      emailVerified: false, // User will verify their email later
    });

    const customClaims: {[key: string]: string} = {};
    if (role) {
        customClaims.role = role;
    }
    if (tenantId) {
        customClaims.tenantId = tenantId;
        customClaims.role = 'End User'; // Assign a default role for end users
    }

    // Set custom claims for the role/tenant
    await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);
    
    // You might want to trigger a password reset or invitation email here
    // For now, we just create the user.

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
