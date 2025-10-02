
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

// --- ONE-TIME SEEDING LOGIC ---
const seedCheckFilePath = path.join(process.cwd(), 'seed-check.json');

async function hasSeedingBeenPerformed(): Promise<boolean> {
    try {
        await fs.access(seedCheckFilePath);
        return true;
    } catch {
        return false;
    }
}

async function markSeedingAsPerformed() {
    await fs.writeFile(seedCheckFilePath, JSON.stringify({ seeded: true, seededAt: new Date().toISOString() }));
}

async function performDatabaseSeeding() {
    if (await hasSeedingBeenPerformed()) {
        return; // Seeding has already been done
    }

    console.log("Performing one-time database seeding...");
    const adminDb = getAdminDb();
    const batch = adminDb.batch();
    let collectionsSeeded = 0;

    const collectionsToSeed = {
        'tenants': { name: 'Seed Tenant', status: 'ACTIVE', createdAt: admin.firestore.FieldValue.serverTimestamp() },
        'expertise_groups': { name: 'General Analysts (Seed)', analystUids: [], createdAt: admin.firestore.FieldValue.serverTimestamp() },
        'feedback': { category: 'Suggestion', summary: 'Initial seed document.', userName: 'system', createdAt: admin.firestore.FieldValue.serverTimestamp() },
        'email_templates': { name: 'Seed Template', subject: 'Subject', body: 'Body', placeholders: [] }
    };

    for (const [collectionName, data] of Object.entries(collectionsToSeed)) {
        const collectionRef = adminDb.collection(collectionName);
        const snapshot = await collectionRef.limit(1).get();
        if (snapshot.empty) {
            const docRef = collectionRef.doc(`seed_${collectionName}`);
            batch.set(docRef, data);
            collectionsSeeded++;
        }
    }

    if (collectionsSeeded > 0) {
        await batch.commit();
        console.log(`Successfully seeded ${collectionsSeeded} collections.`);
    }
    
    await markSeedingAsPerformed();
}


async function getTenantData() {
    const adminDb = getAdminDb();
    const tenantsSnapshot = await adminDb.collection('tenants').orderBy('createdAt', 'desc').get();
    const tenants: any[] = [];
    tenantsSnapshot.forEach(doc => {
        tenants.push({ id: doc.id, ...doc.data() });
    });
    return tenants;
}

async function getUserCountsByTenant() {
    const adminAuth = getAdminAuth();
    const userRecords = await adminAuth.listUsers();
    const counts: { [key: string]: number } = {};
    userRecords.users.forEach(user => {
        const tenantId = user.customClaims?.tenantId;
        if (tenantId) {
            counts[tenantId] = (counts[tenantId] || 0) + 1;
        }
    });
    return counts;
}

async function getTicketCountsByTenant() {
    const adminDb = getAdminDb();
    const ticketsSnapshot = await adminDb.collection('tickets').get();
    const counts: { [key: string]: number } = {};
    ticketsSnapshot.forEach(doc => {
        const clientId = doc.data().clientId; // In our schema, a ticket's clientId is the tenantId
        if (clientId) {
            counts[clientId] = (counts[clientId] || 0) + 1;
        }
    });
    return counts;
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }
        const idToken = authHeader.split('Bearer ')[1];

        const adminAuth = getAdminAuth();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.role !== 'Super Admin') {
            return NextResponse.json({ error: 'Forbidden. Only Super Admins can create tenants.' }, { status: 403 });
        }

        const { companyName, companyUrl, adminName, adminEmail } = await request.json();

        if (!companyName || !adminEmail) {
            return NextResponse.json({ error: 'Company Name and Admin Email are required.' }, { status: 400 });
        }
        
        const adminDb = getAdminDb();

        // Step 1: Create the Tenant Admin user in Firebase Auth
        let adminUserRecord;
        try {
            adminUserRecord = await adminAuth.createUser({
                email: adminEmail,
                displayName: adminName,
                emailVerified: false,
            });
        } catch (error: any) {
            if (error.code === 'auth/email-already-exists') {
                 // If user exists, we can still proceed to create the tenant and associate them.
                 // This assumes an existing user can be made a tenant admin.
                adminUserRecord = await adminAuth.getUserByEmail(adminEmail);
            } else {
                throw error; // Rethrow other user creation errors
            }
        }
        
        // Step 2: Create the Tenant document in Firestore
        const tenantRef = await adminDb.collection('tenants').add({
            name: companyName,
            url: companyUrl || null,
            status: 'INVITED',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            invitationSentAt: admin.firestore.FieldValue.serverTimestamp(), // Track invitation date
            createdBy: decodedToken.uid,
        });

        // Step 3: Set custom claims on the Tenant Admin user
        await adminAuth.setCustomUserClaims(adminUserRecord.uid, {
            role: 'Tenant Admin',
            tenantId: tenantRef.id,
        });

        // Step 4: Create a user profile document for the admin (optional but good practice)
        await adminDb.collection('users').doc(adminUserRecord.uid).set({
            displayName: adminName,
            email: adminEmail,
            role: 'Tenant Admin',
            tenantId: tenantRef.id,
        }, { merge: true });

        // Step 5: Generate a single-use onboarding link (password reset link is a good proxy)
        const onboardingLink = await adminAuth.generatePasswordResetLink(adminEmail);

        return NextResponse.json({
            message: 'Tenant and Admin created successfully.',
            tenantId: tenantRef.id,
            adminUserId: adminUserRecord.uid,
            onboardingLink: onboardingLink,
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating tenant:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}


export async function GET(request: NextRequest) {
  try {
    // --- ONE-TIME SEEDING ---
    // This is no longer the primary seeding mechanism. It will only run if it already has.
    // The main seeding is now handled by the `seedDatabase` AI tool.
    // ------------------------

    const [tenants, userCounts, ticketCounts] = await Promise.all([
        getTenantData(),
        getUserCountsByTenant(),
        getTicketCountsByTenant(),
    ]);

    const enrichedTenants = tenants.map(tenant => ({
        ...tenant,
        createdAt: tenant.createdAt?.toDate().toISOString(), // Convert timestamp to string
        invitationSentAt: tenant.invitationSentAt?.toDate().toISOString() || null,
        userCount: userCounts[tenant.id] || 0,
        ticketsCreated: ticketCounts[tenant.id] || 0,
    }));

    return NextResponse.json({ tenants: enrichedTenants });

  } catch (error: any) {
    console.error('Error listing tenants:', error);
    let errorMessage = 'An unexpected error occurred.';
     if (error.message?.includes('credential error')) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
