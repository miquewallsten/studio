
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getTenantData() {
    const adminDb = getAdminDb();
    const tenantsSnapshot = await adminDb.collection('tenants').get();
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
        const clientId = doc.data().clientId; // clientId on a ticket is the tenantId
        if (clientId) {
            counts[clientId] = (counts[clientId] || 0) + 1;
        }
    });
    return counts;
}

export async function GET(request: NextRequest) {
  try {
    const [tenants, userCounts, ticketCounts] = await Promise.all([
        getTenantData(),
        getUserCountsByTenant(),
        getTicketCountsByTenant(),
    ]);

    const enrichedTenants = tenants.map(tenant => ({
        ...tenant,
        createdAt: tenant.createdAt.toDate().toISOString(), // Convert timestamp to string
        userCount: userCounts[tenant.id] || 0,
        ticketsCreated: ticketCounts[tenant.id] || 0,
    }));

    return NextResponse.json({ tenants: enrichedTenants });

  } catch (error: any) {
    console.error('Error listing tenants:', error);
    let errorMessage = 'An unexpected error occurred.';
     if (error.code === 'app/invalid-credential' || error.message.includes('credential') || error.message.includes('initialization')) {
        errorMessage = 'Firebase Admin SDK credential error. Please ensure server-side environment variables are set correctly.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
