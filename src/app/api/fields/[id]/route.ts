
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
    requireRole( (decodedToken as any).role || 'Unassigned', 'Admin');

    const { id } = params;
    const body = await request.json();
    
    const adminDb = getAdminDb();
    const fieldRef = adminDb.collection('fields').doc(id);
    
    await fieldRef.update({
        ...body,
        updatedAt: new Date(),
    });

    return { success: true };
  });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return apiSafe(async () => {
    checkRateLimit(request);
    const decodedToken = await requireAuth(request);
    requireRole( (decodedToken as any).role || 'Unassigned', 'Super Admin');

    const { id } = params;
    
    const adminDb = getAdminDb();
    await adminDb.collection('fields').doc(id).delete();

    return { success: true, message: 'Field deleted.' };
  });
}
