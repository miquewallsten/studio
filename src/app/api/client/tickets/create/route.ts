import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { suggestComplianceQuestions } from '@/ai/flows/compliance-question-suggestions';
import admin from 'firebase-admin';

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
        const clientUid = decodedToken.uid;
        const clientEmail = decodedToken.email;

        const { subjectName, email, reportType, description } = await request.json();

        if (!subjectName || !email || !reportType) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const adminDb = getAdminDb();
        const batch = adminDb.batch();

        // Step 1: Create or get the end-user in Firebase Auth and associate with the client (tenant)
        let endUserRecord;
        try {
            endUserRecord = await adminAuth.createUser({
                email: email,
                emailVerified: false,
            });
        } catch (error: any) {
            if (error.code === 'auth/email-already-exists') {
                endUserRecord = await adminAuth.getUserByEmail(email);
            } else {
                throw error; // Rethrow other user creation errors
            }
        }

        // Set custom claims to associate the end-user with the client who created them.
        await adminAuth.setCustomUserClaims(endUserRecord.uid, { 
            role: 'End User',
            tenantId: clientUid 
        });
        
        // Also create a user profile doc for the new end user for easier querying if needed
        const userProfileRef = adminDb.collection('users').doc(endUserRecord.uid);
        batch.set(userProfileRef, {
            email: endUserRecord.email,
            displayName: subjectName, // Use subject name as initial display name
            role: 'End User',
            tenantId: clientUid,
        }, { merge: true });


        // Step 2: Get AI-suggested compliance questions
        const { suggestedQuestions } = await suggestComplianceQuestions({
            reportType,
            description,
        });

        // Step 3: Create the ticket in Firestore
        const ticketRef = adminDb.collection('tickets').doc(); // Create a new doc reference
        batch.set(ticketRef, {
            subjectName,
            email,
            reportType,
            description,
            suggestedQuestions,
            status: 'New',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            clientId: clientUid, // The ID of the client company/user who made the request
            clientEmail: clientEmail,
            endUserId: endUserRecord.uid, // The ID of the newly created end-user who will fill the form
        });

        // Commit all Firestore operations in a single batch
        await batch.commit();

        return NextResponse.json({
            success: true,
            ticketId: ticketRef.id,
            message: 'Successfully created ticket and end-user.',
        }, { status: 201 });


    } catch (error: any) {
        console.error('Error creating ticket from client request:', error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired. Please log in again.' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
