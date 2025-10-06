
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { uid: string } }) {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    try {
        checkRateLimit(request);
        const { uid } = params;
        const body = await request.json();
        const { displayName, phone, tags } = body;

        const decodedToken = await requireAuth(request);
        requireRole( (decodedToken as any).role || 'Unassigned', 'Admin');

        // Update Firebase Auth
        const authUpdates: { [key: string]: any } = {};
        if (displayName !== undefined) {
            authUpdates.displayName = displayName;
        }
        if (Object.keys(authUpdates).length > 0) {
           await adminAuth.updateUser(uid, authUpdates);
        }

        // Update Firestore user profile document
        const userRef = adminDb.collection('users').doc(uid);
        const profileData: { [key: string]: any } = {};
        if (displayName !== undefined) {
            profileData.displayName = displayName;
        }
        if (phone !== undefined) {
            profileData.phone = phone;
        }
        if (tags !== undefined) {
            profileData.tags = tags;
        }

        if (Object.keys(profileData).length > 0) {
            await userRef.set(profileData, { merge: true });
        }

        logger.info('User profile updated', { adminUid: decodedToken.uid, targetUid: uid });
        return NextResponse.json({ message: 'User updated successfully' });

    } catch (error: any) {
        logger.error('Error updating user', { error: error.message, targetUid: params.uid });
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { uid: string } }) {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    try {
        checkRateLimit(request);
        const { uid } = params;

        const decodedToken = await requireAuth(request);
        requireRole( (decodedToken as any).role || 'Unassigned', 'Super Admin');
        
        if (decodedToken.uid === uid) {
            return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 });
        }

        await adminAuth.deleteUser(uid);
        
        // Optionally, delete user data from Firestore as well
        await adminDb.collection('users').doc(uid).delete().catch(err => {
            // Log error but don't fail the whole operation if Firestore deletion fails
            logger.warn(`Failed to delete Firestore user profile for UID ${uid}:`, { error: err.message });
        });

        logger.info('User deleted successfully', { adminUid: decodedToken.uid, targetUid: uid });
        return NextResponse.json({ message: 'User deleted successfully' });

    } catch (error: any) {
        logger.error('Error deleting user:', { error: error.message, targetUid: params.uid });
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
