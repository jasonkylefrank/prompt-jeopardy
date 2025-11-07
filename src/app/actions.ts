
'use server';

import { revalidatePath } from 'next/cache';
import type { Game, Player, Submission } from '@/lib/types';
import { generateLLMResponse as generateLLMResponseFlow } from '@/ai/flows/generate-llm-response';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/server';

async function saveGame(game: Game): Promise<void> {
  const gameDocRef = doc(firestore, 'games', game.id);
  await setDoc(gameDocRef, game, { merge: true });
}

// --- GAME CREATION AND JOINING ---

export async function createGame(hostData: Omit<Player, 'score' | 'isHost'>): Promise<string> {
  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const host: Player = { ...hostData, score: 0, isHost: true };

  const newGame: Game = {
    id: gameId,
    hostId: host.id,
    hostName: host.name,
    status: 'lobby',
    players: {},
    rounds: [],
    currentRound: 0,
    currentAskerId: null,
    liveQuestion: { 
      text: '',
      persona: '',
      action: '',
      personaPool: [],
      actionPool: [],
    },
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
    game.players[playerData.id] = { ...playerData, score: 0, isHost: false };
    await saveGame(game);
  }

  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/host`);
  return { success: true, message: 'Joined game.' };
}

// --- GAME STATE MANAGEMENT ---

export async function getGameState(gameId: string): Promise<Game | null> {
  const gameDocRef = doc(firestore, 'games', gameId);
  const gameDoc = await getDoc(gameDocRef);
  if (!gameDoc.exists()) {
    return null;
  }
  return gameDoc.data() as Game;
}

export async function getAllGames(): Promise<Game[]> {
    const gamesCollectionRef = collection(firestore, 'games');
    const gamesSnapshot = await getDocs(gamesCollectionRef);
    const games: Game[] = [];
    gamesSnapshot.forEach(doc => {
      games.push(doc.data() as Game);
    });
    return games;
}

export async function advanceGameState(
  gameId: string,
  newStatus: Game['status'],
  options?: { persona?: string, action?: string, personaPool?: string[], actionPool?: string[] }
) {
  const game = await getGameState(gameId);
  if (!game) return;

  game.status = newStatus;

  // Logic for advancing from lobby to asking
  if (newStatus === 'asking' && game.currentRound === 0) {
    game.currentRound = 1;
    if(options?.persona && options?.action && options?.personaPool && options?.actionPool) {
        game.liveQuestion.persona = options.persona;
        game.liveQuestion.action = options.action;
        game.liveQuestion.personaPool = options.personaPool;
        game.liveQuestion.actionPool = options.actionPool;
    }

    const playerIds = Object.keys(game.players).filter(id => !game.players[id].isHost);
    if (playerIds.length > 0) {
      game.currentAskerId = playerIds[0];
    }
  } 
  // Logic for advancing to a new round (from scoring to asking)
  else if (newStatus === 'asking' && game.status !== 'lobby') {
    game.currentRound += 1;
     if(options?.persona && options?.action && options?.personaPool && options?.actionPool) {
        game.liveQuestion.persona = options.persona;
        game.liveQuestion.action = options.action;
        game.liveQuestion.personaPool = options.personaPool;
        game.liveQuestion.actionPool = options.actionPool;
    }
    
    const playerIds = Object.keys(game.players).filter(id => !game.players[id].isHost);
    
    if (playerIds.length > 0) {
      // Determine the next asker
      const currentAskerIndex = game.currentAskerId ? playerIds.indexOf(game.currentAskerId) : -1;
      const nextAskerIndex = (currentAskerIndex + 1) % playerIds.length;
      game.currentAskerId = playerIds[nextAskerIndex];
    } else {
      // No non-host players, maybe reset or handle this case
      game.currentAskerId = null;
    }
    // Reset live question text for the new round
    game.liveQuestion.text = '';
  }


  if (newStatus === 'finished') {
    // any cleanup for game end
  }


  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/host`);
  revalidatePath(`/history/${gameId}`);
  revalidatePath(`/history`);
}

// --- LIVE QUESTION ACTIONS ---
export async function updateLiveQuestion(gameId: string, questionText: string) {
    const gameDocRef = doc(firestore, 'games', gameId);
    await updateDoc(gameDocRef, { 'liveQuestion.text': questionText });
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/host`);
}

export async function setRoundData(gameId: string, data: { persona?: string, action?: string, personaPool?: string[], actionPool?: string[]}) {
    const gameDocRef = doc(firestore, 'games', gameId);
    const updateData: Record<string, any> = {};
    if (data.persona !== undefined) updateData['liveQuestion.persona'] = data.persona;
    if (data.action !== undefined) updateData['liveQuestion.action'] = data.action;
    if (data.personaPool !== undefined) updateData['liveQuestion.personaPool'] = data.personaPool;
    if (data.actionPool !== undefined) updateData['liveQuestion.actionPool'] = data.actionPool;

    await updateDoc(gameDocRef, updateData);
    revalidatePath(`/game/${gameId}/host`);
}


// --- ROUND ACTIONS ---

export async function submitQuestion(gameId: string) {
  const game = await getGameState(gameId);
  if (!game || !game.liveQuestion.text || !game.liveQuestion.persona || !game.liveQuestion.action || !game.currentAskerId || !game.liveQuestion.personaPool || !game.liveQuestion.actionPool) return;

  game.status = 'responding';
  const newRound = {
    roundNumber: game.currentRound, 
    questionAskerId: game.currentAskerId,
    question: game.liveQuestion.text,
    llmResponse: '',
    submissions: {},
    isScored: false,
    correctAnswer: { 
      persona: game.liveQuestion.persona,
      action: game.liveQuestion.action,
    },
    personaPool: game.liveQuestion.personaPool,
    actionPool: game.liveQuestion.actionPool,
  };

  // If it's a new round, push it. Otherwise, update the existing one if needed.
  const existingRoundIndex = game.rounds.findIndex(r => r.roundNumber === game.currentRound);
  if (existingRoundIndex > -1) {
    game.rounds[existingRoundIndex] = newRound;
  } else {
    game.rounds.push(newRound);
  }

  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/host`);
  revalidatePath(`/history/${gameId}`);

  generateAndSaveLLMResponse(gameId, game.liveQuestion.text, game.liveQuestion.persona, game.liveQuestion.action);
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

  const currentRoundIndex = game.rounds.findIndex(r => r.roundNumber === game.currentRound);
  if (currentRoundIndex > -1) {
    game.rounds[currentRoundIndex].llmResponse = llmResult.response;
    game.status = 'answering';
    await saveGame(game);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/host`);
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

  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRound);
  if (currentRound && !currentRound.submissions[playerId]) {
    currentRound.submissions[playerId] = submission;
    await saveGame(game);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/host`);
    revalidatePath(`/history/${gameId}`);
  }
}

export async function scoreRound(gameId: string) {
  const game = await getGameState(gameId);
  if (!game) return;

  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRound);
  if (!currentRound || currentRound.isScored) return;

  const { persona: correctPersona, action: correctAction } =
    currentRound.correctAnswer;

  Object.entries(currentRound.submissions).forEach(([playerId, submission]) => {
    // Only score non-host players
    if (game.players[playerId] && !game.players[playerId].isHost) {
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
        game.players[playerId].score += points;
    }
  });

  currentRound.isScored = true;
  game.status = 'scoring';
  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/host`);
  revalidatePath(`/history/${gameId}`);
}
