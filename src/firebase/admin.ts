'use server';

// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK and should not be imported into client components.

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.stack);
  }
}

const firestore = admin.firestore();

export { firestore };
