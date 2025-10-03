
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

async function getLeastBusyAnalyst(groupId: string): Promise<string | null> {
    const adminDb = getAdminDb();
    const groupRef = adminDb.collection('expertise_groups').doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
        console.warn(`Expertise group ${groupId} not found.`);
        return null;
    }

    const analystUids = groupSnap.data()?.analystUids;

    if (!analystUids || analystUids.length === 0) {
        console.warn(`No analysts found in group ${groupId}.`);
        return null;
    }

    // In a real application, you would query the 'tickets' collection to find
    // the analyst with the fewest 'In Progress' tickets.
    // For this prototype, we'll randomly assign.
    const randomIndex = Math.floor(Math.random() * analystUids.length);
    return analystUids[randomIndex];
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Not authenticated. No auth header.' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const clientUid = decodedToken.uid;
        const clientEmail = decodedToken.email;

        const { subjectName, email, reportType, description, formId } = await request.json();

        if (!subjectName || !email || !reportType || !formId) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

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


        // Step 2: Auto-assignment logic
        const formRef = adminDb.collection('forms').doc(formId);
        const formSnap = await formRef.get();
        const expertiseGroupId = formSnap.data()?.expertiseGroupId;
        
        let assignedAnalystId = null;
        let ticketStatus = 'New';

        if (expertiseGroupId) {
            assignedAnalystId = await getLeastBusyAnalyst(expertiseGroupId);
            if (assignedAnalystId) {
                ticketStatus = 'In Progress';
            }
        }

        // Step 3: Create the ticket in Firestore
        const ticketRef = adminDb.collection('tickets').doc(); 
        batch.set(ticketRef, {
            subjectName,
            email,
            reportType,
            formId,
            description,
            status: ticketStatus,
            assignedAnalystId: assignedAnalystId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            clientId: clientUid, 
            clientEmail: clientEmail,
            endUserId: endUserRecord.uid,
        });

        // Commit Firestore operations
        await batch.commit();

        // Step 4: Generate a secure, single-use link for the user to set their password and access the form.
        const passwordResetLink = await adminAuth.generatePasswordResetLink(email);
        
        const actionCode = new URL(passwordResetLink).searchParams.get('oobCode');
        const actionLink = `${request.nextUrl.origin}/onboard?oobCode=${actionCode}&continueUrl=/form/${ticketRef.id}`;
        
        const emailHtml = `
            <p>Hello ${subjectName},</p>
            <p>${decodedToken.name || clientEmail} has requested that you complete a form for a ${reportType}.</p>
            <p>Please use the secure link below to set up your account and fill out the required information:</p>
            <p><a href="${actionLink}">Complete Your Form</a></p>
            <p>This link is for single use only.</p>
            <p>Thank you,<br/>The TenantCheck Team</p>
        `.replace(/\n/g, '<br>');

        // Step 5: Send the email to the end-user via our own API route
        const emailRes = await fetch(`${request.nextUrl.origin}/api/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                 'Authorization': `Bearer ${idToken}` // Pass auth for security
            },
            body: JSON.stringify({
                to: email,
                subject: `Information Request for ${reportType}`,
                html: emailHtml,
            }),
        });

        if (!emailRes.ok) {
            const errorData = await emailRes.json();
            console.warn('Failed to send email:', errorData.error);
            // Don't fail the whole request, but maybe log it
        }


        return NextResponse.json({
            success: true,
            ticketId: ticketRef.id,
            message: `Successfully created ticket and sent secure form link to ${email}.`,
        }, { status: 201 });


    } catch (error: any) {
        console.error('Error creating ticket from client request:', error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/id-token-expired') {
            errorMessage = 'Authentication token expired. Please log in again.';
        } else if (error.message?.includes('credential error')) {
            errorMessage = error.message;
        }
        return NextResponse.json({
            error: errorMessage,
        }, { status: 500 });
    }
}
