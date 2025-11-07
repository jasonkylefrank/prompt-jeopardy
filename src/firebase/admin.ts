
import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    admin.initializeApp();
    firestore = admin.firestore();
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin SDK. Check server logs for details.');
  }
} else {
  firestore = admin.firestore();
}

export { firestore };
