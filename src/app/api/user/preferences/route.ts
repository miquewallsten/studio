
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const adminDb = getAdminDb();
    try {
        const decodedToken = await requireAuth(request);
        const uid = decodedToken.uid;

        const prefs = await request.json();

        // Store preferences in a 'dashboard' document within a 'preferences' subcollection for the user.
        const userPrefsRef = adminDb.collection('users').doc(uid).collection('preferences').doc('dashboard');

        // We use set with merge: true to create or update the document.
        await userPrefsRef.set(prefs, { merge: true });

        return NextResponse.json({ success: true, message: 'Preferences updated.' });

    } catch (error: any) {
        console.error('Error updating preferences:', error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/id-token-expired') {
            errorMessage = 'Authentication token expired. Please log in again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const adminDb = getAdminDb();
    try {
        const decodedToken = await requireAuth(request);
        const uid = decodedToken.uid;
        
        // Fetch preferences from the 'dashboard' document within the 'preferences' subcollection.
        const userPrefsRef = adminDb.collection('users').doc(uid).collection('preferences').doc('dashboard');
        const docSnap = await userPrefsRef.get();

        if (!docSnap.exists) {
             return NextResponse.json({ error: 'No preferences found.' }, { status: 404 });
        }
        
        return NextResponse.json(docSnap.data());

    } catch (error: any) {
        console.error('Error fetching preferences:', error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/id-token-expired') {
            errorMessage = 'Authentication token expired. Please log in again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
