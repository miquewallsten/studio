
import { getAdminDb } from '@/lib/firebaseAdmin';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return apiSafe(async () => {
    checkRateLimit(request);
    const decodedToken = await requireAuth(request);
    requireRole(decodedToken.role, 'Admin');

    const { id } = params;
    const { subject, body } = await request.json();

    const adminDb = getAdminDb();
    const templateRef = adminDb.collection('email_templates').doc(id);
    
    await templateRef.update({
        subject,
        body
    });

    return { success: true };
  });
}
