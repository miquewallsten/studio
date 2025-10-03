
import { getAdminDb } from '@/lib/firebaseAdmin';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { NextRequest } from 'next/server';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return apiSafe(async () => {
    checkRateLimit(request);
    await requireAuth(request); // Any authenticated user can view fields for forms

    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    let query: admin.firestore.Query = adminDb.collection('fields');

    if (ids) {
        const idArray = ids.split(',');
        query = query.where(admin.firestore.FieldPath.documentId(), 'in', idArray);
    } else {
        query = query.orderBy('label');
    }

    const fieldsSnapshot = await query.get();
    
    const fields = fieldsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return { fields };
  });
}

export async function POST(request: NextRequest) {
  return apiSafe(async () => {
    checkRateLimit(request);
    const decodedToken = await requireAuth(request);
    requireRole(decodedToken.role, 'Admin');

    const body = await request.json();
    const { label, type, subFields, internalFields, aiInstructions } = body;
    
    if (!label || !type) {
      throw new Error('Label and Type are required.');
    }
    
    const adminDb = getAdminDb();
    const docRef = await adminDb.collection('fields').add({
        ...body,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { id: docRef.id, message: 'Field created successfully.' };
  });
}
