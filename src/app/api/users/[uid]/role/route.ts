
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';
import { requireRole, Role } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimit';

const VALID_ROLES: Role[] = ['Super Admin', 'Admin', 'Manager', 'Analyst', 'View Only', 'Tenant Admin', 'Tenant User', 'End User', 'Unassigned'];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    try {
        checkRateLimit(request);
        const { uid } = params;
        const { role } = await request.json();

        if (!role || !VALID_ROLES.includes(role)) {
            return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 });
        }

        const decodedToken = await requireAuth(request);
        requireRole( (decodedToken as any).role || 'Unassigned', 'Admin');

        // Prevent a regular Admin from creating a Super Admin
        if (role === 'Super Admin' && decodedToken.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Forbidden. Only Super Admins can assign the Super Admin role.' }, { status: 403 });
        }

        const targetUser = await adminAuth.getUser(uid);
        const existingClaims = targetUser.customClaims || {};

        // Set custom claims for the role
        const newClaims = { ...existingClaims, role: role };
        await adminAuth.setCustomUserClaims(uid, newClaims);

        // Also update the role in the Firestore user profile for consistency
        await adminDb.collection('users').doc(uid).set({ role: role }, { merge: true });
        
        logger.info('User role updated', { adminUid: decodedToken.uid, targetUid: uid, newRole: role });

        return NextResponse.json({ message: `User role successfully updated to ${role}` });

    } catch (error: any) {
        logger.error('Error updating user role', { error: error.message, targetUid: params.uid });
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
