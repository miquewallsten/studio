
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    try {
        const decodedToken = await requireAuth(request);
        
        // Tenant Admins query by their tenantId, their own uid is the tenantId for other users.
        const tenantId = decodedToken.tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'User is not associated with a tenant.' }, { status: 403 });
        }

        const ticketsQuery = adminDb.collection('tickets').where('clientId', '==', tenantId).orderBy('createdAt', 'desc');
        const querySnapshot = await ticketsQuery.get();

        const tickets: any[] = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            tickets.push({ 
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString(),
            });
        });

        return NextResponse.json({ tickets });

    } catch (error: any) {
        console.error('Error fetching client tickets:', error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/id-token-expired') {
            errorMessage = 'Authentication token expired. Please log in again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
