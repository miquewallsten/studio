
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // defaults to auto

async function getTenants() {
    const tenantsSnapshot = await adminDb.collection('tenants').get();
    const tenants: { [key: string]: string } = {};
    tenantsSnapshot.forEach(doc => {
        tenants[doc.id] = doc.data().name;
    });
    return tenants;
}

export async function GET(request: NextRequest) {
  try {
    const tenants = await getTenants();
    const listUsersResult = await adminAuth.listUsers();
    
    const users = listUsersResult.users.map(userRecord => {
        const tenantId = userRecord.customClaims?.tenantId;
        const role = userRecord.customClaims?.role || 'Unassigned';

        return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            disabled: userRecord.disabled,
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
    if (error.code === 'app/invalid-credential' || error.message.includes('credential')) {
        errorMessage = 'Firebase Admin SDK credential error. Please ensure server-side environment variables (FIREBASE_PROJECT_ID, etc.) are set correctly.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
