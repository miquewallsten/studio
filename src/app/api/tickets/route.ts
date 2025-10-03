
import { getAdminDb } from '@/lib/firebaseAdmin';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { checkRateLimit } from '@/lib/rateLimit';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return apiSafe(async () => {
    checkRateLimit(request);
    await requireAuth(request);

    const adminDb = getAdminDb();
    const ticketsSnapshot = await adminDb.collection('tickets').orderBy('createdAt', 'desc').get();
    
    const tickets = ticketsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(), // Convert Timestamp to ISO string
      }
    });
    
    return { tickets };
  });
}
