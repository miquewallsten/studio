
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    try {
        checkRateLimit(request);
        const { id: tenantId } = params;

        const decodedToken = await requireAuth(request);
        requireRole( (decodedToken as any).role || 'Unassigned', 'Super Admin');

        const batch = adminDb.batch();

        // 1. Find all users associated with the tenant
        const usersQuerySnapshot = await adminDb.collection('users').where('tenantId', '==', tenantId).get();
        const userIdsToDelete: string[] = [];
        usersQuerySnapshot.forEach(doc => {
            userIdsToDelete.push(doc.id);
            batch.delete(doc.ref); // Delete user profile from Firestore
        });

        // 2. Delete users from Firebase Auth
        // This has to be done separately from the Firestore batch
        if (userIdsToDelete.length > 0) {
            await Promise.all(userIdsToDelete.map(uid => adminAuth.deleteUser(uid).catch(err => {
                // Log error but don't fail the whole operation if a user is already deleted
                logger.warn(`Failed to delete user ${uid} from Auth during tenant deletion:`, { error: err.message });
            })));
        }

        // 3. Delete the tenant document
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        batch.delete(tenantRef);

        // Commit all Firestore deletions
        await batch.commit();
        
        logger.info('Tenant deleted successfully', { tenantId, deletedUsers: userIdsToDelete.length });

        return NextResponse.json({ message: 'Tenant and all associated users deleted successfully' });

    } catch (error: any) {
        logger.error('Error deleting tenant:', { error: error.message, tenantId: params.id });
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
