
import { getAdminDb } from '@/lib/firebaseAdmin';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { checkRateLimit } from '@/lib/rateLimit';
import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/rbac';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return apiSafe(async () => {
    checkRateLimit(request);
    await requireAuth(request);

    const adminDb = getAdminDb();
    const formsSnapshot = await adminDb.collection('forms').orderBy('name').get();
    
    const forms = formsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      }
    });
    
    return { forms };
  });
}

export async function POST(request: NextRequest) {
    return apiSafe(async () => {
        checkRateLimit(request);
        const decodedToken = await requireAuth(request);
        requireRole( (decodedToken as any).role || 'Unassigned', 'Admin');

        const { name, description } = await request.json();
        
        if (!name) {
            throw new Error('Form Name is required.');
        }

        const adminDb = getAdminDb();
        const docRef = await adminDb.collection('forms').add({
            name,
            description,
            fields: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { id: docRef.id, message: 'Form created successfully.' };
    });
}
