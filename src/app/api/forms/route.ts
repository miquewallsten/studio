import { getAdminDb } from '@/lib/firebaseAdmin';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// This endpoint is used by the client portal to get a list of available form templates.
export async function GET(request: Request) {
  return apiSafe(async () => {
    checkRateLimit(request);
    // This endpoint can be accessed by any authenticated user who has access to the client portal.
    await requireAuth(request);

    const adminDb = getAdminDb();
    const formsSnapshot = await adminDb.collection('forms').orderBy('name').get();
    
    const forms = formsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
    }));
    
    return { forms };
  });
}
