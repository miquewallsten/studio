
import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

const initializeAdmin = () => {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
