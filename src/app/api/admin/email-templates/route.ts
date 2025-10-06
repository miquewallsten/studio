
import { getAdminDb } from '@/lib/firebaseAdmin';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return apiSafe(async () => {
    checkRateLimit(request);
    const decodedToken = await requireAuth(request as any);
    requireRole( (decodedToken as any).role || 'Unassigned', 'Admin');

    const adminDb = getAdminDb();
    const templatesSnapshot = await adminDb.collection('email_templates').orderBy('name').get();
    
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return { templates };
  });
}
