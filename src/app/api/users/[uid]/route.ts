import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { uid: string } }) {
    try {
        const { uid } = params;
        const body = await request.json();
        const { displayName, phone, tags } = body;

        // --- Security Check: Ensure caller is an admin ---
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const isAdmin = decodedToken.role === 'Admin' || decodedToken.role === 'Super Admin';

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden. You do not have permission to edit users.' }, { status: 403 });
        }
        // --- End Security Check ---


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


        return NextResponse.json({ message: 'User updated successfully' });

    } catch (error: any) {
        console.error('Error updating user:', error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'User not found.';
        } else if (error.code === 'auth/id-token-expired') {
            errorMessage = 'Authentication token has expired. Please log in again.';
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { uid: string } }) {
    try {
        const { uid } = params;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        
        if (decodedToken.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Forbidden. Only Super Admins can delete users.' }, { status: 403 });
        }

        await adminAuth.deleteUser(uid);
        
        // Optionally, delete user data from Firestore as well
        await adminDb.collection('users').doc(uid).delete().catch(err => {
            // Log error but don't fail the whole operation if Firestore deletion fails
            console.error(`Failed to delete Firestore user profile for UID ${uid}:`, err);
        });

        return NextResponse.json({ message: 'User deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'User not found.';
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
