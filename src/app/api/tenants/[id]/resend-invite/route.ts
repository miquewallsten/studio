
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { requireAuth } from '@/lib/authApi';
import { requireRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    try {
        const { id: tenantId } = params;

        const decodedToken = await requireAuth(request);
        // TODO: Resolve user role from a reliable source (e.g., Firestore) instead of just the token claim.
        requireRole(decodedToken.role, 'Super Admin');

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
