"use client";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

if (Object.values(firebaseConfig).some(v => !v)) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_* env vars in client init");
}

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length > 0) {
  firebaseApp = getApp();
} else {
  firebaseApp = initializeApp(firebaseConfig);
}

auth = getAuth(firebaseApp);
db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };
