
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs
} from 'firebase/firestore';
// Use the new server-side firestore instance
import { firestore } from '@/firebase/server';
import type { Game } from './types';

export async function getGame(id: string): Promise<Game | null> {
  const gameDocRef = doc(firestore, 'games', id);
  const gameDoc = await getDoc(gameDocRef);
  if (!gameDoc.exists()) {
    return null;
  }
  return gameDoc.data() as Game;
}

export async function saveGame(game: Game): Promise<void> {
  const gameDocRef = doc(firestore, 'games', game.id);
  await setDoc(gameDocRef, game, { merge: true });
}

export async function getGames(): Promise<Game[]> {
  const gamesCollectionRef = collection(firestore, 'games');
  const gamesSnapshot = await getDocs(gamesCollectionRef);
  const games: Game[] = [];
  gamesSnapshot.forEach(doc => {
    games.push(doc.data() as Game);
  });
  return games;
}
