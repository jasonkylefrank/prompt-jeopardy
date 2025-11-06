// IMPORTANT: This file is for server-side use only.
// It is not marked with 'use client' and should not be imported by client components.

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const firestore = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export { firestore, auth, firebaseApp };
