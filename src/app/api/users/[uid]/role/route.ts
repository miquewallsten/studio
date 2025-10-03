
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';

// Predefined roles
const VALID_ROLES = ['Admin', 'Analyst', 'Manager', 'View Only', 'Super Admin', 'Tenant Admin', 'Tenant User', 'End User'];


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
    const adminAuth = getAdminAuth();
    try {
        const { uid } = params;
        const { role } = await request.json();

        if (!role || !VALID_ROLES.includes(role)) {
            return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 });
        }

        // --- Security Check: Ensure caller is an admin ---
        const decodedToken = await requireAuth(request);
        const isAdmin = decodedToken.role === 'Admin' || decodedToken.role === 'Super Admin';

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden. You do not have permission to change user roles.' }, { status: 403 });
        }
         // Prevent a regular Admin from creating a Super Admin
        if (role === 'Super Admin' && decodedToken.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Forbidden. Only Super Admins can assign the Super Admin role.' }, { status: 403 });
        }
        // --- End Security Check ---

        const targetUser = await adminAuth.getUser(uid);
        const existingClaims = targetUser.customClaims || {};

        // Set custom claims for the role
        await adminAuth.setCustomUserClaims(uid, { ...existingClaims, role: role });
        
        return NextResponse.json({ message: `User role successfully updated to ${role}` });

    } catch (error: any) {
        console.error('Error updating user role:', error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'User not found.';
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
