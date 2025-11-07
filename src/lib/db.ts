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

export async function saveGame(game: Game): Promise<void> {
  const gameDocRef = doc(firestore, 'games', game.id);
  try {
    await setDoc(gameDocRef, game, { merge: true });
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const contextualError = new FirestorePermissionError({
        operation: 'write', // Covers create and update
        path: gameDocRef.path,
        requestResourceData: game,
      });
      errorEmitter.emit('permission-error', contextualError);
    }
     // We don't re-throw here to avoid crashing the server action
  }
}
