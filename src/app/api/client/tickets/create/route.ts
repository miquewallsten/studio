
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

async function getLeastBusyAnalyst(groupId: string): Promise<string | null> {
    const adminDb = getAdminDb();
    const groupRef = adminDb.collection('expertise_groups').doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
        logger.warn(`Expertise group ${groupId} not found.`);
        return null;
    }

    const analystUids = groupSnap.data()?.analystUids;

    if (!analystUids || analystUids.length === 0) {
        logger.warn(`No analysts found in group ${groupId}.`);
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
    try {
        checkRateLimit(request);
        const decodedToken = await requireAuth(request);
        const { subjectName, email, reportType, description, formId } = await request.json();
        
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();
        

        requireRole(decodedToken.role, 'Tenant Admin');
        
        const clientUid = decodedToken.tenantId;
        const clientEmail = decodedToken.email;

        if (!clientUid) {
            return NextResponse.json({ error: 'Client is not associated with a tenant.' }, { status: 403 });
        }


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

        // We need the original token to pass to the email API
        const authHeader = request.headers.get('Authorization');
        const idToken = authHeader ? authHeader.split('Bearer ')[1] : '';

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
            logger.warn('Failed to send email:', errorData.error);
            // Don't fail the whole request, but maybe log it
        }

        logger.info('Ticket created successfully', { ticketId: ticketRef.id, clientId: clientUid });

        return NextResponse.json({
            success: true,
            ticketId: ticketRef.id,
            message: `Successfully created ticket and sent secure form link to ${email}.`,
        }, { status: 201 });


    } catch (error: any) {
        logger.error('Error creating ticket from client request:', { error: error.message, code: error.code });
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
