
'use server';

import { revalidatePath } from 'next/cache';
import type { Game, Player, Submission } from '@/lib/types';
import { generateLLMResponse as generateLLMResponseFlow } from '@/ai/flows/generate-llm-response';
import { collection, getDocs, doc, getDoc, setDoc, FirestoreError } from "firebase/firestore";
import { firestore } from '@/firebase/server';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This function was moved from `lib/db.ts` to `actions.ts` to resolve a server/client module conflict.
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

// --- GAME CREATION AND JOINING ---

export async function createGame(host: Omit<Player, 'score'>): Promise<string> {
  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const hostPlayer: Player = { ...host, score: 0, isHost: true };

  const newGame: Game = {
    id: gameId,
    hostId: host.id,
    status: 'lobby',
    players: {
      [host.id]: hostPlayer,
    },
    rounds: [],
    currentRound: 0,
    currentAskerId: host.id,
  };

  await saveGame(newGame);
  return gameId;
}

export async function joinGame(
  gameId: string,
  playerData: Omit<Player, 'score'>
): Promise<{ success: boolean; message: string }> {
  const game = await getGameState(gameId);
  if (!game) {
    return { success: false, message: 'Game not found.' };
  }

  // To prevent re-joining with a different name, we'll need a way to identify a user within a session.
  // For now, we'll allow re-joining, but in a real app, this would need more robust handling.
  const playerDoc = await getDoc(doc(firestore, 'games', gameId, 'players', playerData.id));


  if (!playerDoc.exists() && game.status !== 'lobby') {
    return { success: false, message: 'Game has already started.' };
  }
  
  if (!game.players[playerData.id]) {
    game.players[playerData.id] = { ...playerData, score: 0 };
    await saveGame(game);
  }

  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/admin`);
  return { success: true, message: 'Joined game.' };
}

// --- GAME STATE MANAGEMENT ---

export async function getGameState(gameId: string): Promise<Game | null> {
  const gameDocRef = doc(firestore, 'games', gameId);
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

export async function getAllGames(): Promise<Game[]> {
    const gamesCollectionRef = collection(firestore, 'games');
    try {
      const gamesSnapshot = await getDocs(gamesCollectionRef);
      const games: Game[] = [];
      gamesSnapshot.forEach(doc => {
        games.push(doc.data() as Game);
      });
      return games;
    } catch (error) {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
              operation: 'list',
              path: gamesCollectionRef.path,
          });
          errorEmitter.emit('permission-error', contextualError);
      }
      return []; // Return empty array on error
    }
}

export async function advanceGameState(
  gameId: string,
  newStatus: Game['status']
) {
  const game = await getGameState(gameId);
  if (!game) return;

  game.status = newStatus;

  // Logic for advancing rounds
  if (newStatus === 'asking') {
    // Filter out the host before determining the next asker
    const playerIds = Object.keys(game.players).filter(id => !game.players[id].isHost);
    
    if (playerIds.length > 0) {
      const currentAskerIndex = playerIds.indexOf(game.currentAskerId);
      const nextAskerIndex = (currentAskerIndex + 1) % playerIds.length;
      game.currentAskerId = playerIds[nextAskerIndex];

      // Increment round only when it cycles back to the first player
      if (nextAskerIndex === 0) {
        game.currentRound += 1;
      }
    } else {
      // If only the host is present, they become the asker.
      game.currentAskerId = game.hostId;
    }
  }


  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/admin`);
  revalidatePath(`/history/${gameId}`);
  revalidatePath(`/history`);
}

// --- ROUND ACTIONS ---

export async function submitQuestion(
  gameId: string,
  {
    question,
    persona,
    action,
  }: { question: string; persona: string; action: string }
) {
  const game = await getGameState(gameId);
  if (!game) return;

  game.status = 'responding';
  const newRound = {
    roundNumber: game.rounds.length, // use length for 0-based index
    questionAskerId: game.currentAskerId,
    question,
    llmResponse: '',
    submissions: {},
    isScored: false,
    correctAnswer: { persona, action },
  };
  game.rounds.push(newRound);

  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/admin`);
  revalidatePath(`/history/${gameId}`);

  // Start LLM response generation asynchronously
  generateAndSaveLLMResponse(gameId, question, persona, action);
}

async function generateAndSaveLLMResponse(
  gameId: string,
  question: string,
  persona: string,
  action: string
) {
  const llmResult = await generateLLMResponseFlow({
    question,
    persona,
    action,
  });

  const game = await getGameState(gameId);
  if (!game) return;

  const currentRound = game.rounds[game.rounds.length - 1];
  if (currentRound) {
    currentRound.llmResponse = llmResult.response;
    game.status = 'answering';
    await saveGame(game);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/admin`);
    revalidatePath(`/history/${gameId}`);
  }
}

export async function submitAnswer(
  gameId: string,
  playerId: string,
  submission: Submission
) {
  const game = await getGameState(gameId);
  if (!game || game.status !== 'answering') return;

  const currentRound = game.rounds[game.rounds.length - 1];
  if (currentRound && !currentRound.submissions[playerId]) {
    currentRound.submissions[playerId] = submission;
    await saveGame(game);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/admin`);
    revalidatePath(`/history/${gameId}`);
  }
}

export async function scoreRound(gameId: string) {
  const game = await getGameState(gameId);
  if (!game) return;

  const currentRound = game.rounds[game.rounds.length - 1];
  if (!currentRound || currentRound.isScored) return;

  const { persona: correctPersona, action: correctAction } =
    currentRound.correctAnswer;

  Object.entries(currentRound.submissions).forEach(([playerId, submission]) => {
    const isPersonaCorrect = submission.persona === correctPersona;
    const isActionCorrect = submission.action === correctAction;
    let points = 0;
    if (isPersonaCorrect && isActionCorrect) {
      points = 100; // Both correct
    } else if (isPersonaCorrect || isActionCorrect) {
      points = 25; // One correct
    } else {
      points = -10; // Both incorrect
    }
    if (game.players[playerId]) {
      game.players[playerId].score += points;
    }
  });

  currentRound.isScored = true;
  game.status = 'scoring';
  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/admin`);
  revalidatePath(`/history/${gameId}`);
}
