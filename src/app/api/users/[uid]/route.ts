
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { uid: string } }) {
    try {
        const { uid } = params;
        const body = await request.json();
        const { displayName, phone } = body;

        // --- Security Check: Ensure caller is an admin ---
        const cookieStore = cookies();
        const idToken = cookieStore.get('firebaseIdToken')?.value;

        if (!idToken) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }

        const adminAuth = getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const isAdmin = decodedToken.role === 'Admin' || decodedToken.role === 'Super Admin';

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden. You do not have permission to edit users.' }, { status: 403 });
        }
        // --- End Security Check ---


        // Update Firebase Auth
        if (displayName !== undefined) {
            await adminAuth.updateUser(uid, { displayName });
        }

        // Update Firestore user profile document
        if (phone !== undefined) {
            const adminDb = getAdminDb();
            const userRef = adminDb.collection('users').doc(uid);
            await userRef.set({ phone: phone }, { merge: true });
        }

        return NextResponse.json({ message: 'User updated successfully' });

    } catch (error: any) {
        console.error('Error updating user:', error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'User not found.';
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
