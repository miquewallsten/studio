
import { getAdminDb } from '@/lib/firebaseAdmin';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return apiSafe(async () => {
    checkRateLimit(request);
    await requireAuth(request); // Any authenticated user can view a form structure

    const { id } = params;
    const adminDb = getAdminDb();
    const formDoc = await adminDb.collection('forms').doc(id).get();

    if (!formDoc.exists) {
      throw new Error('Form not found.');
    }

    return { form: { id: formDoc.id, ...formDoc.data() } };
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return apiSafe(async () => {
    checkRateLimit(request);
    const decodedToken = await requireAuth(request);
    requireRole(decodedToken.role, 'Admin');

    const { id } = params;
    const body = await request.json();
    
    const adminDb = getAdminDb();
    const formRef = adminDb.collection('forms').doc(id);
    
    await formRef.update({
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
    requireRole(decodedToken.role, 'Super Admin');

    const { id } = params;
    
    const adminDb = getAdminDb();
    await adminDb.collection('forms').doc(id).delete();

    return { success: true, message: 'Form deleted.' };
  });
}
