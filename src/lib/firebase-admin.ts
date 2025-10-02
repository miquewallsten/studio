

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This guard prevents the module from ever being imported on the client.
if (typeof window !== 'undefined') {
  throw new Error('src/lib/firebase-admin.ts can only be imported on the server');
}

const initializeAdmin = () => {
    if (getApps().length === 0) {
        try {
            // This will automatically use the file path from the GOOGLE_APPLICATION_CREDENTIALS environment variable.
            // In this project, that is set to './service-account.json' in the .env file.
            initializeApp({
                credential: applicationDefault(),
            });
        } catch (error: any) {
            console.error('Firebase admin initialization error', error);
            // Re-throw a more user-friendly error to be caught by the UI
            if (error.code === 'ENOENT') {
                 throw new Error(`Firebase admin initialization error: Failed to read credentials from file ${process.env.GOOGLE_APPLICATION_CREDENTIALS}. Error: ${error.message}. Please follow the setup instructions.`);
            }
            throw new Error('Firebase admin initialization error: ' + error.message);
        }
    }
};

// Lazily initialize and get the auth instance
export const getAdminAuth = () => {
    initializeAdmin();
    return getAuth();
};

// Lazily initialize and get the firestore instance
export const getAdminDb = () => {
    initializeAdmin();
    return getFirestore();
};
