
import { getAdminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Predefined roles
const VALID_ROLES = ['Admin', 'Analyst', 'Manager', 'View Only'];

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required.' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();

    // Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      emailVerified: false, // User will verify their email later
    });

    // Set custom claims for the role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: role });
    
    // You might want to trigger a password reset or invitation email here
    // For now, we just create the user.

    return NextResponse.json({ uid: userRecord.uid, email: userRecord.email, role: role });

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
