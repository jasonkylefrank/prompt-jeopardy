'use client';

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  FirestoreError,
} from 'firebase/firestore';
import { firestore } from '@/firebase/server';
import type { Game } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This file is largely deprecated as its functions are being moved to server actions.
// getGameState remains here for client-side polling but may be removed later.

export async function getGame(id: string): Promise<Game | null> {
  const gameDocRef = doc(firestore, 'games', id);
  try {
    const gameDoc = await getDoc(gameDocRef);
    if (!gameDoc.exists()) {
      return null;
    }
    return gameDoc.data() as Game;
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const contextualError = new FirestorePermissionError({
        operation: 'get',
        path: gameDocRef.path,
      });
      errorEmitter.emit('permission-error', contextualError);
    }
    // Return null or re-throw a generic error if it's not a permission issue
    return null;
  }
}
