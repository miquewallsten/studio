
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Not authenticated. No auth header.' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];

        const adminAuth = getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const prefs = await request.json();

        const adminDb = getAdminDb();
        const userPrefsRef = adminDb.collection('user_preferences').doc(uid);

        // We use set with merge: true to create or update the document.
        await userPrefsRef.set(prefs, { merge: true });

        return NextResponse.json({ success: true, message: 'Preferences updated.' });

    } catch (error: any) {
        console.error('Error updating preferences:', error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired. Please log in again.' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Not authenticated. No auth header.' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];

        const adminAuth = getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        
        const adminDb = getAdminDb();
        const userPrefsRef = adminDb.collection('user_preferences').doc(uid);
        const docSnap = await userPrefsRef.get();

        if (!docSnap.exists()) {
             return NextResponse.json({ error: 'No preferences found.' }, { status: 404 });
        }
        
        return NextResponse.json(docSnap.data());

    } catch (error: any) {
        console.error('Error fetching preferences:', error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired. Please log in again.' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
