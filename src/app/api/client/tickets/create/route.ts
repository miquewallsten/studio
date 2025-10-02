
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { suggestComplianceQuestions } from '@/ai/flows/compliance-question-suggestions';
import { sendEmail } from '@/ai/flows/send-email-flow';
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

        const { subjectName, email, reportType, description, formId } = await request.json();

        if (!subjectName || !email || !reportType || !formId) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const adminDb = getAdminDb();
        const batch = adminDb.batch();

        // Step 1: Create or get the end-user in Firebase Auth and associate with the client (tenant)
        let endUserRecord;
        try {
            endUserRecord = await adminAuth.createUser({
                email: email,
                emailVerified: false, // Will be verified by password reset link
                displayName: subjectName,
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
        
        const userProfileRef = adminDb.collection('users').doc(endUserRecord.uid);
        batch.set(userProfileRef, {
            email: endUserRecord.email,
            displayName: subjectName,
            role: 'End User',
            tenantId: clientUid,
        }, { merge: true });


        // Step 2: Get AI-suggested compliance questions
        // This is now redundant if we are using questions from the form, but could be used for enhancement later.
        // For now, questions will be pulled from the form template on the client-side.
        // const { suggestedQuestions } = await suggestComplianceQuestions({
        //     reportType,
        //     description,
        // });

        // Step 3: Create the ticket in Firestore
        const ticketRef = adminDb.collection('tickets').doc(); 
        batch.set(ticketRef, {
            subjectName,
            email,
            reportType,
            formId,
            description,
            // suggestedQuestions,
            status: 'New',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            clientId: clientUid, 
            clientEmail: clientEmail,
            endUserId: endUserRecord.uid,
        });

        // Commit Firestore operations
        await batch.commit();

        // Step 4: Generate a secure, single-use link for the user to set their password and access the form.
        // We use a password reset link which also verifies their email.
        const passwordResetLink = await adminAuth.generatePasswordResetLink(email);
        
        // Extract oobCode and construct the final URL
        const actionCode = new URL(passwordResetLink).searchParams.get('oobCode');
        const actionLink = `${request.nextUrl.origin}/onboard?oobCode=${actionCode}&continueUrl=/form/${ticketRef.id}`;
        
        // Step 5: Send the email to the end-user
        await sendEmail({
            to: email,
            subject: `Information Request for ${reportType}`,
            html: `
                <p>Hello ${subjectName},</p>
                <p>${decodedToken.name || clientEmail} has requested that you complete a form for a ${reportType}.</p>
                <p>Please use the secure link below to set up your account and fill out the required information:</p>
                <p><a href="${actionLink}">Complete Your Form</a></p>
                <p>This link is for single use only.</p>
                <p>Thank you,<br/>The TenantCheck Team</p>
            `.replace(/\n/g, '<br>')
        });


        return NextResponse.json({
            success: true,
            ticketId: ticketRef.id,
            message: `Successfully created ticket and sent secure form link to ${email}.`,
        }, { status: 201 });


    } catch (error: any) {
        console.error('Error creating ticket from client request:', error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired. Please log in again.' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
