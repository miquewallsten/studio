
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { uid: string } }) {
    try {
        const { uid } = params;
        const body = await request.json();
        const { displayName, phone, tags } = body;

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
        const adminDb = getAdminDb();
        const userRef = adminDb.collection('users').doc(uid);
        const profileData: { [key: string]: any } = {};

        if (phone !== undefined) {
            profileData.phone = phone;
        }
        if (tags !== undefined) {
            profileData.tags = tags;
        }

        if (Object.keys(profileData).length > 0) {
            await userRef.set(profileData, { merge: true });
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
