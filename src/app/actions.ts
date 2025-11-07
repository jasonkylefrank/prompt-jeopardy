
'use server';

import { revalidatePath } from 'next/cache';
import type { Game, Player, Submission } from '@/lib/types';
import { generateLLMResponse as generateLLMResponseFlow } from '@/ai/flows/generate-llm-response';
import { collection, getDocs, doc, getDoc, setDoc, FirestoreError } from "firebase/firestore";
import { firestore } from '@/firebase/server';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function saveGame(game: Game): Promise<void> {
  const gameDocRef = doc(firestore, 'games', game.id);
  await setDoc(gameDocRef, game, { merge: true });
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
  playerData: Omit<Player, "score">
): Promise<{ success: boolean; message: string }> {
  const game = await getGameState(gameId);
  if (!game) {
    return { success: false, message: 'Game not found.' };
  }
  
  if (game.status !== 'lobby') {
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
      return []; 
    }
}

export async function advanceGameState(
  gameId: string,
  newStatus: Game['status']
) {
  const game = await getGameState(gameId);
  if (!game) return;

  game.status = newStatus;

  if (newStatus === 'asking') {
    const playerIds = Object.keys(game.players).filter(id => !game.players[id].isHost);
    
    if (playerIds.length > 0) {
      const currentAskerIndex = playerIds.indexOf(game.currentAskerId);
      const nextAskerIndex = (currentAskerIndex + 1) % playerIds.length;
      game.currentAskerId = playerIds[nextAskerIndex];

      if (nextAskerIndex === 0) {
        game.currentRound += 1;
      }
    } else {
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
    roundNumber: game.rounds.length, 
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
      points = 100; 
    } else if (isPersonaCorrect || isActionCorrect) {
      points = 25; 
    } else {
      points = -10; 
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
