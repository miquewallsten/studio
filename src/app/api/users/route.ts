
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

async function getTenants() {
    const adminDb = getAdminDb();
    const tenantsSnapshot = await adminDb.collection('tenants').get();
    const tenants: { [key: string]: string } = {};
    tenantsSnapshot.forEach(doc => {
        tenants[doc.id] = doc.data().name;
    });
    return tenants;
}

async function getUserProfilesAndTags(tenantId?: string) {
    const adminDb = getAdminDb();
    let query: admin.firestore.Query<admin.firestore.DocumentData> = adminDb.collection('users');
    if (tenantId) {
        query = query.where('tenantId', '==', tenantId);
    }
    const profilesSnapshot = await query.get();
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

async function getTicketCounts(tenantId?: string) {
    const adminDb = getAdminDb();
    let query: admin.firestore.Query<admin.firestore.DocumentData> = adminDb.collection('tickets');
    if (tenantId) {
        query = query.where('clientId', '==', tenantId);
    }
    const ticketsSnapshot = await query.get();
    const counts: { [key: string]: number } = {};
    ticketsSnapshot.forEach(doc => {
        const clientId = doc.data().clientId; // In our schema, a ticket's clientId is the tenantId
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
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Not authenticated. No auth header.' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const callerRole = decodedToken.role;
    const callerTenantId = callerRole === 'Tenant Admin' ? decodedToken.tenantId : undefined;

    const [tenants, { profiles, allTags }, tickets] = await Promise.all([
        getTenants(), 
        getUserProfilesAndTags(callerTenantId), 
        getTicketCounts(callerTenantId)
    ]);
    
    let userRecords: admin.auth.UserRecord[];

    if (callerTenantId) {
        const userProfiles = Object.keys(profiles);
        if (userProfiles.length === 0) {
            userRecords = [];
        } else {
             const result = await adminAuth.getUsers(userProfiles.map(uid => ({ uid })));
             userRecords = result.users;
        }
    } else {
        const listUsersResult = await adminAuth.listUsers();
        userRecords = listUsersResult.users;
    }
    
    const userProcessingPromises = userRecords.map(async (userRecord) => {
        const tenantId = userRecord.customClaims?.tenantId;
        let role = userRecord.customClaims?.role || 'Unassigned';
        const profile = profiles[userRecord.uid];

        if (userRecord.email === 'mikewallsten@me.com' && userRecord.customClaims?.role !== 'Super Admin') {
            role = 'Super Admin';
            try {
                await adminAuth.setCustomUserClaims(userRecord.uid, { ...userRecord.customClaims, role: 'Super Admin' });
            } catch (claimError) {
                console.error(`Failed to set Super Admin claim for ${userRecord.email}:`, claimError);
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
            tenantName: tenantId ? tenants[tenantId] : (role === 'Tenant Admin' ? 'N/A' : 'Internal Staff'),
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
    if (error.message?.includes('credential error')) {
        errorMessage = error.message;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
