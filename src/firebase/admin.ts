'use server';

// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK and should not be imported into client components.

import * as admin from 'firebase-admin';
import type { firestore as adminFirestore } from 'firebase-admin';

let firestore: adminFirestore.Firestore;

if (!admin.apps.length) {
  try {
    // When running in a Google Cloud environment, the SDK can auto-discover credentials.
    // However, in some environments, we need to provide the project ID explicitly.
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    console.log("Firebase Admin initialized successfully.");
    firestore = admin.firestore();
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.stack);
    // If initialization fails, we need to prevent the app from crashing by not exporting a broken firestore instance.
    // We'll throw an error during development to make the problem obvious.
    throw new Error('Failed to initialize Firebase Admin SDK. Check server logs for details.');
  }
} else {
  // If the app is already initialized, just get the firestore instance.
  firestore = admin.firestore();
}


export { firestore };
