
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

async function getUserProfilesAndTags() {
    const adminDb = getAdminDb();
    const profilesSnapshot = await adminDb.collection('users').get();
    const profiles: { [key: string]: { phone?: string, tags?: string[] } } = {};
    const allTags = new Set<string>();
    profilesSnapshot.forEach(doc => {
        const data = doc.data();
        profiles[doc.id] = data;
        if (data.tags) {
            data.tags.forEach((tag: string) => allTags.add(tag));
        }
    });
    return { profiles, allTags: Array.from(allTags) };
}

async function getTicketCounts() {
    const adminDb = getAdminDb();
    const ticketsSnapshot = await adminDb.collection('tickets').get();
    const counts: { [key: string]: number } = {};
    ticketsSnapshot.forEach(doc => {
        const clientId = doc.data().clientId;
        if (clientId) {
            if (!counts[clientId]) {
                counts[clientId] = 0;
            }
            counts[clientId]++;
        }
    });
    return counts;
}


export async function GET(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const [tenants, { profiles, allTags }, tickets] = await Promise.all([getTenants(), getUserProfilesAndTags(), getTicketCounts()]);
    
    const listUsersResult = await adminAuth.listUsers();
    
    const userProcessingPromises = listUsersResult.users.map(async (userRecord) => {
        const tenantId = userRecord.customClaims?.tenantId;
        let role = userRecord.customClaims?.role || 'Unassigned';
        const profile = profiles[userRecord.uid];

        // Ensure the primary user is always a Super Admin by setting their custom claim if not already set.
        if (userRecord.email === 'mikewallsten@me.com' && userRecord.customClaims?.role !== 'Super Admin') {
            role = 'Super Admin';
            try {
                await adminAuth.setCustomUserClaims(userRecord.uid, { ...userRecord.customClaims, role: 'Super Admin' });
            } catch (claimError) {
                console.error(`Failed to set Super Admin claim for ${userRecord.email}:`, claimError);
                // Continue with the role set in-memory for the current response
            }
        }


        return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            disabled: userRecord.disabled,
            phone: profile?.phone || null,
            tags: profile?.tags || [],
            tenantId: tenantId,
            tenantName: tenantId ? tenants[tenantId] : 'Internal Staff',
            role: role,
            createdAt: userRecord.metadata.creationTime,
            ticketsCreated: tickets[userRecord.uid] || 0,
        }
    });

    const users = await Promise.all(userProcessingPromises);

    return NextResponse.json({ users, allTags });
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
