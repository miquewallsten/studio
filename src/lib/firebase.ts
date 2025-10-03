
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1-yMpv2_uv13l_leUYyVCBscanqUGORQ",
  authDomain: "studio-3755263487-6db2c.firebaseapp.com",
  projectId: "studio-3755263487-6db2c",
  storageBucket: "studio-3755263487-6db2c.appspot.com",
  messagingSenderId: "264861209691",
  appId: "1:264861209691:web:da998a83d059d2bbbe9b7e"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
