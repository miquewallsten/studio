import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { apiSafe } from '@/lib/api-safe';

// Predefined roles
const VALID_ROLES = ['Admin', 'Analyst', 'Manager', 'View Only', 'Super Admin', 'Tenant Admin', 'Tenant User', 'End User'];

export async function POST(request: NextRequest) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  return apiSafe(async () => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Not authenticated: missing Bearer token');
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const { email, role, tenantId } = await request.json();

    if (!email) {
      throw new Error('Email is required.');
    }
    if (!role && !tenantId) {
        throw new Error('Either a role or a tenantId must be provided.');
    }

    if (role && !VALID_ROLES.includes(role)) {
      throw new Error('Invalid role specified.');
    }
    
    if (decodedToken.role !== 'Super Admin' && !tenantId) {
        throw new Error('Forbidden. You can only invite users to a tenant.');
    }
    
    if (tenantId && decodedToken.tenantId !== tenantId && decodedToken.role !== 'Super Admin') {
        throw new Error('Forbidden. You cannot invite users to this tenant.');
    }

    let userRecord;
    try {
        userRecord = await adminAuth.createUser({
          email: email,
          emailVerified: false,
        });
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            userRecord = await adminAuth.getUserByEmail(email);
        } else {
            throw error;
        }
    }
    
    const batch = adminDb.batch();

    const customClaims: {[key: string]: string} = {};
    const userProfile: {[key: string]: any} = {
        email: userRecord.email,
    };

    if (role) {
        customClaims.role = role;
        userProfile.role = role;
    }
    if (tenantId) {
        customClaims.tenantId = tenantId;
        userProfile.tenantId = tenantId;
        if (!role || (role !== 'Tenant Admin' && role !== 'End User')) {
            customClaims.role = 'End User';
            userProfile.role = 'End User';
        }
    }

    await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);
    
    const userRef = adminDb.collection('users').doc(userRecord.uid);
    batch.set(userRef, userProfile, { merge: true });
    
    await batch.commit();

    return { uid: userRecord.uid, email: userRecord.email, claims: customClaims };
  });
}
