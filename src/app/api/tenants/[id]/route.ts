
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    try {
        const { id: tenantId } = params;

        const decodedToken = await requireAuth(request);
        // TODO: Resolve user role from a reliable source (e.g., Firestore) instead of just the token claim.
        requireRole(decodedToken.role, 'Super Admin');

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
                console.error(`Failed to delete user ${uid} from Auth:`, err);
            })));
        }

        // 3. Delete the tenant document
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        batch.delete(tenantRef);

        // Commit all Firestore deletions
        await batch.commit();

        return NextResponse.json({ message: 'Tenant and all associated users deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting tenant:', error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/id-token-expired') {
            errorMessage = 'Authentication token has expired. Please log in again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
