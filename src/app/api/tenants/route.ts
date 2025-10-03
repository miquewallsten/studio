import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { apiSafe } from '@/lib/api-safe';

async function getTenantData() {
    const adminDb = getAdminDb();
    const tenantsSnapshot = await adminDb.collection('tenants').orderBy('createdAt', 'desc').get();
    const tenants: any[] = [];
    tenantsSnapshot.forEach(doc => {
        tenants.push({ id: doc.id, ...doc.data() });
    });
    return tenants;
}

async function getUserCountsByTenant() {
    const adminAuth = getAdminAuth();
    const userRecords = await adminAuth.listUsers();
    const counts: { [key: string]: number } = {};
    userRecords.users.forEach(user => {
        const tenantId = user.customClaims?.tenantId;
        if (tenantId) {
            counts[tenantId] = (counts[tenantId] || 0) + 1;
        }
    });
    return counts;
}

async function getTicketCountsByTenant() {
    const adminDb = getAdminDb();
    const ticketsSnapshot = await adminDb.collection('tickets').get();
    const counts: { [key: string]: number } = {};
    ticketsSnapshot.forEach(doc => {
        const clientId = doc.data().clientId; // In our schema, a ticket's clientId is the tenantId
        if (clientId) {
            counts[clientId] = (counts[clientId] || 0) + 1;
        }
    });
    return counts;
}

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
        if (decodedToken.role !== 'Super Admin') {
            throw new Error('Forbidden. Only Super Admins can create tenants.');
        }

        const { companyName, companyUrl, adminName, adminEmail } = await request.json();

        if (!companyName || !adminEmail) {
            throw new Error('Company Name and Admin Email are required.');
        }
        
        let adminUserRecord;
        try {
            adminUserRecord = await adminAuth.createUser({
                email: adminEmail,
                displayName: adminName,
                emailVerified: false,
            });
        } catch (error: any) {
            if (error.code === 'auth/email-already-exists') {
                adminUserRecord = await adminAuth.getUserByEmail(adminEmail);
            } else {
                throw error;
            }
        }
        
        const tenantRef = await adminDb.collection('tenants').add({
            name: companyName,
            url: companyUrl || null,
            status: 'INVITED',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            invitationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: decodedToken.uid,
        });

        await adminAuth.setCustomUserClaims(adminUserRecord.uid, {
            role: 'Tenant Admin',
            tenantId: tenantRef.id,
        });

        await adminDb.collection('users').doc(adminUserRecord.uid).set({
            displayName: adminName,
            email: adminEmail,
            role: 'Tenant Admin',
            tenantId: tenantRef.id,
        }, { merge: true });

        const onboardingLink = await adminAuth.generatePasswordResetLink(adminEmail);

        return {
            message: 'Tenant and Admin created successfully.',
            tenantId: tenantRef.id,
            adminUserId: adminUserRecord.uid,
            onboardingLink: onboardingLink,
        };
    });
}


export async function GET(request: NextRequest) {
  return apiSafe(async () => {
    const [tenants, userCounts, ticketCounts] = await Promise.all([
        getTenantData(),
        getUserCountsByTenant(),
        getTicketCountsByTenant(),
    ]);

    const enrichedTenants = tenants.map(tenant => ({
        ...tenant,
        createdAt: tenant.createdAt?.toDate().toISOString(),
        invitationSentAt: tenant.invitationSentAt?.toDate().toISOString() || null,
        userCount: userCounts[tenant.id] || 0,
        ticketsCreated: ticketCounts[tenant.id] || 0,
    }));

    return { tenants: enrichedTenants };
  });
}
