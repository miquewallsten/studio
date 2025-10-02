
import admin from 'firebase-admin';

// This guard prevents the module from ever being imported on the client.
if (typeof window !== 'undefined') {
  throw new Error('src/lib/firebase-admin.ts can only be imported on the server');
}

const initializeAdmin = () => {
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey) {
            // This error will be caught by API routes and surfaced to the user.
            throw new Error('Firebase Admin SDK credential error: Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set correctly in your .env file.');
        }

        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        } catch (error: any) {
            console.error('Firebase admin initialization error', error.stack);
            throw new Error('Firebase admin initialization error: ' + error.message);
        }
    }
};

// Lazily initialize and get the auth instance
export const getAdminAuth = () => {
    initializeAdmin();
    return admin.auth();
};

// Lazily initialize and get the firestore instance
export const getAdminDb = () => {
    initializeAdmin();
    return admin.firestore();
};
