
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // defaults to auto

async function getTenants() {
    const adminDb = getAdminDb();
    const tenantsSnapshot = await adminDb.collection('tenants').get();
    const tenants: { [key: string]: string } = {};
    tenantsSnapshot.forEach(doc => {
        tenants[doc.id] = doc.data().name;
    });
    return tenants;
}

async function getUserProfiles() {
    const adminDb = getAdminDb();
    const profilesSnapshot = await adminDb.collection('users').get();
    const profiles: { [key: string]: { phone?: string } } = {};
    profilesSnapshot.forEach(doc => {
        profiles[doc.id] = doc.data();
    });
    return profiles;
}

export async function GET(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const [tenants, userProfiles] = await Promise.all([getTenants(), getUserProfiles()]);
    
    const listUsersResult = await adminAuth.listUsers();
    
    const users = listUsersResult.users.map(userRecord => {
        const tenantId = userRecord.customClaims?.tenantId;
        const role = userRecord.customClaims?.role || 'Unassigned';
        const profile = userProfiles[userRecord.uid];

        return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            disabled: userRecord.disabled,
            phone: profile?.phone || null,
            tenantId: tenantId,
            tenantName: tenantId ? tenants[tenantId] : null,
            role: role,
            createdAt: userRecord.metadata.creationTime,
        }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error listing users:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'app/invalid-credential' || error.message.includes('credential') || error.message.includes('initialization')) {
        errorMessage = 'Firebase Admin SDK credential error. Please ensure server-side environment variables (FIREBASE_PROJECT_ID, etc.) are set correctly in your .env file.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
