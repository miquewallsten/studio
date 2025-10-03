
import { getAdminDb } from '@/lib/firebaseAdmin';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { checkRateLimit } from '@/lib/rateLimit';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return apiSafe(async () => {
    checkRateLimit(request);
    await requireAuth(request); // Any authenticated user can view a ticket structure

    const { id } = params;
    const adminDb = getAdminDb();
    const ticketDoc = await adminDb.collection('tickets').doc(id).get();

    if (!ticketDoc.exists) {
      throw new Error('Ticket not found.');
    }
    
    const data = ticketDoc.data();
    const ticket = {
      id: ticketDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate().toISOString(),
      formSubmittedAt: data?.formSubmittedAt?.toDate().toISOString(),
      ratingSubmittedAt: data?.ratingSubmittedAt?.toDate().toISOString(),
    }

    return { ticket };
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    return apiSafe(async () => {
        checkRateLimit(request);
        const decodedToken = await requireAuth(request);

        const { id } = params;
        const body = await request.json();

        const adminDb = getAdminDb();
        const ticketRef = adminDb.collection('tickets').doc(id);

        await ticketRef.update({
            ...body,
            updatedAt: new Date(),
        });

        return { success: true };
    });
}
