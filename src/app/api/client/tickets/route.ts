
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Not authenticated. No auth header.' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];

        const adminAuth = getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        
        let uid: string;
        // Tenant Admins query by their tenantId, their own uid is the tenantId for other users.
        const tenantId = decodedToken.tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'User is not associated with a tenant.' }, { status: 403 });
        }

        const adminDb = getAdminDb();
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
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired. Please log in again.' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message ||