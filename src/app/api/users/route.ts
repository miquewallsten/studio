
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

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
    let query: admin.firestore.Query = adminDb.collection('users');
    if (tenantId) {
        query = query.where('tenantId', '==', tenantId);
    }
    const profilesSnapshot = await query.get();
    const profiles: { [key: string]: { phone?: string, tags?: string[] } } = {};
    const allTags = new Set<string>();
    profilesSnapshot.forEach(doc => {
        const data = doc.data();
        profiles[doc.id] = data;
        if (data.tags && Array.isArray(data.tags)) {
            data.tags.forEach((tag: string) => allTags.add(tag));
        }
    });
    return { profiles, allTags: Array.from(allTags) };
}


async function getTicketCountsByClient() {
    const adminDb = getAdminDb();
    const ticketsSnapshot = await adminDb.collection('tickets').get();
    const counts: { [key: string]: number } = {};
    ticketsSnapshot.forEach(doc => {
        const clientId = doc.data().clientId;
        if (clientId) {
            counts[clientId] = (counts[clientId] || 0) + 1;
        }
    });
    return counts;
}

export async function GET(request: NextRequest) {
  return apiSafe(async () => {
    checkRateLimit(request);
    const adminAuth = getAdminAuth();
    const decodedToken = await requireAuth(request);
    
    const isTenantAdmin = decodedToken.role === 'Tenant Admin';
    const callerTenantId = isTenantAdmin ? decodedToken.tenantId : undefined;

    // Only Admins or Super Admins can view all users
    if (!isTenantAdmin) {
        requireRole(decodedToken.role, 'Admin');
    }

    const [tenants, { profiles, allTags }, ticketCounts] = await Promise.all([
        getTenants(), 
        getUserProfilesAndTags(callerTenantId), 
        getTicketCountsByClient()
    ]);
    
    let userRecords: admin.auth.UserRecord[];

    if (callerTenantId) {
        // For Tenant Admins, we only fetch users belonging to their tenant from Auth.
        const userIdsInTenant = Object.keys(profiles);
        if (userIdsInTenant.length === 0) {
            userRecords = [];
        } else {
             const result = await adminAuth.getUsers(userIdsInTenant.map(uid => ({ uid })));
             userRecords = result.users;
        }
    } else {
        // For internal admins, fetch all users.
        const listUsersResult = await adminAuth.listUsers();
        userRecords = listUsersResult.users;
    }
    
    const userProcessingPromises = userRecords.map(async (userRecord) => {
        const tenantId = userRecord.customClaims?.tenantId;
        
        // If the caller is a tenant admin, we must not show users from other tenants.
        if (callerTenantId && tenantId !== callerTenantId) {
            return null;
        }

        const role = (userRecord.customClaims?.role || 'Unassigned');
        const profile = profiles[userRecord.uid];

        return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            disabled: userRecord.disabled,
            phone: profile?.phone || null,
            tags: profile?.tags || [],
            tenantId: tenantId,
            tenantName: tenantId ? tenants[tenantId] : null,
            role: role,
            createdAt: userRecord.metadata.creationTime,
            ticketsCreated: ticketCounts[userRecord.uid] || 0,
        }
    });

    const users = (await Promise.all(userProcessingPromises)).filter(Boolean);

    return { users, allTags };
  });
}
