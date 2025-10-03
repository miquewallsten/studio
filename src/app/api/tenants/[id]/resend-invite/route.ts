import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id: tenantId } = params;

        // Security Check: Only Super Admins can resend invites
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];
        
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Forbidden. Only Super Admins can resend invitations.' }, { status: 403 });
        }

        // Find the Tenant Admin user associated with this tenant
        const usersQuerySnapshot = await adminDb.collection('users').where('tenantId', '==', tenantId).where('role', '==', 'Tenant Admin').limit(1).get();

        if (usersQuerySnapshot.empty) {
            return NextResponse.json({ error: 'Could not find an admin user for this tenant.' }, { status: 404 });
        }
        
        const tenantAdmin = usersQuerySnapshot.docs[0].data();
        const adminEmail = tenantAdmin.email;

        if (!adminEmail) {
            return NextResponse.json({ error: 'Tenant admin does not have an email address.' }, { status: 400 });
        }

        // Generate a new single-use onboarding link
        const onboardingLink = await adminAuth.generatePasswordResetLink(adminEmail);
        
        // Update the invitationSentAt timestamp on the tenant document
        const tenantRef = adminDb.collection('tenants').doc(tenantId);
        await tenantRef.update({
            invitationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
            message: 'New onboarding link generated successfully.',
            onboardingLink: onboardingLink,
            adminEmail: adminEmail,
            adminName: tenantAdmin.displayName || '',
        }, { status: 200 });


    } catch (error: any) {
        console.error('Error resending invitation:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
