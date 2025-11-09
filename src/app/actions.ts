
'use server';

import { revalidatePath } from 'next/cache';
import type { Game, Player, Submission, Round, Phase } from '@/lib/types';
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
    players: { [host.id]: host },
    rounds: [],
    currentRoundNumber: 0,
    currentPhaseNumber: 0,
    currentAskerId: null,
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
    const newPlayer = { ...playerData, score: 0, isHost: false };
    const gameDocRef = doc(firestore, 'games', gameId);
    await updateDoc(gameDocRef, {
        [`players.${playerData.id}`]: newPlayer
    });
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

export async function advanceToNextRound(
  gameId: string,
  options: { persona: string, action: string, personaPool: string[], actionPool: string[] }
) {
  const game = await getGameState(gameId);
  if (!game) return;

  game.status = 'asking';
  game.currentRoundNumber += 1;
  game.currentPhaseNumber = 1;

  const newRound: Round = {
    roundNumber: game.currentRoundNumber,
    correctAnswer: {
      persona: options.persona,
      action: options.action,
    },
    personaPool: options.personaPool,
    actionPool: options.actionPool,
    phases: [],
  };

  const newPhase: Phase = {
    phaseNumber: game.currentPhaseNumber,
    questionAskerId: '', // Will be set when asker is determined
    question: '',
    llmResponse: '',
    submissions: {},
    isScored: false,
  };
  newRound.phases.push(newPhase);
  
  game.rounds.push(newRound);

  // Set first asker for the new round
  const playerIds = Object.keys(game.players).filter(id => !game.players[id].isHost);
  if (playerIds.length > 0) {
    const lastAskerIndex = game.currentAskerId ? playerIds.indexOf(game.currentAskerId) : -1;
    const nextAskerIndex = (lastAskerIndex + 1) % playerIds.length;
    game.currentAskerId = playerIds[nextAskerIndex];
    // Also set it in the phase
    newPhase.questionAskerId = game.currentAskerId;
  }

  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/host`);
  revalidatePath(`/history/${gameId}`);
}

export async function finishGame(gameId: string) {
    const game = await getGameState(gameId);
    if (!game) return;
    game.status = 'game-finished';
    await saveGame(game);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/host`);
    revalidatePath(`/history/${gameId}`);
}


// --- PHASE ACTIONS ---

export async function submitQuestion(gameId: string, questionText: string, askerId: string, isFinal: boolean) {
    const game = await getGameState(gameId);
    if (!game) return;
  
    // Check if it's the right person's turn
    if (game.currentAskerId !== askerId || game.status !== 'asking') {
      console.warn(`Unauthorized or out-of-order question submission by ${askerId}`);
      return;
    }
  
    const currentRound = game.rounds.find(r => r.roundNumber === game.currentRoundNumber);
    const currentPhase = currentRound?.phases.find(p => p.phaseNumber === game.currentPhaseNumber);

    if (!currentPhase) return;

    // Update question text
    currentPhase.question = questionText;

    if (isFinal) {
      game.status = 'responding';
      // Start LLM generation in the background
      generateAndSaveLLMResponse(gameId, questionText, currentRound.correctAnswer.persona, currentRound.correctAnswer.action);
    }
  
    await saveGame(game);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/host`);
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

  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRoundNumber);
  const currentPhase = currentRound?.phases.find(p => p.phaseNumber === game.currentPhaseNumber);

  if (currentPhase) {
    currentPhase.llmResponse = llmResult.response;
    game.status = 'answering';
    await saveGame(game);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/host`);
  }
}

export async function submitAnswer(
  gameId: string,
  playerId: string,
  submission: Submission
) {
  const game = await getGameState(gameId);
  if (!game || game.status !== 'answering') return;

  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRoundNumber);
  const currentPhase = currentRound?.phases.find(p => p.phaseNumber === game.currentPhaseNumber);
  
  if (currentPhase && !currentPhase.submissions[playerId]) {
    // Use Firestore's dot notation to update a nested object field
    const gameDocRef = doc(firestore, 'games', game.id);
    await updateDoc(gameDocRef, {
      [`rounds.${game.currentRoundNumber - 1}.phases.${game.currentPhaseNumber - 1}.submissions.${playerId}`]: submission
    });

    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/host`);
  }
}

export async function scorePhase(gameId: string) {
  const game = await getGameState(gameId);
  if (!game) return;

  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRoundNumber);
  const currentPhase = currentRound?.phases.find(p => p.phaseNumber === game.currentPhaseNumber);
  
  if (!currentRound || !currentPhase || currentPhase.isScored) return;

  const { persona: correctPersona, action: correctAction } = currentRound.correctAnswer;

  Object.entries(currentPhase.submissions).forEach(([playerId, submission]) => {
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

  currentPhase.isScored = true;
  game.status = 'scoring'; // Go to scoring screen first
  
  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/host`);
}


export async function advanceAfterScoring(gameId: string) {
  const game = await getGameState(gameId);
  if (!game || game.status !== 'scoring') return;

  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRoundNumber);
  if (!currentRound) return;
  
  const correctGuessMade = Object.values(currentRound.phases).some(phase => 
    Object.values(phase.submissions).some(sub => 
      sub.persona === currentRound.correctAnswer.persona && sub.action === currentRound.correctAnswer.action
    )
  );

  if (correctGuessMade) {
    game.status = 'round-finished';
  } else {
    // Setup for the next phase in the same round
    game.status = 'asking';
    game.currentPhaseNumber += 1;
    
    // Move to the next asker
    const playerIds = Object.keys(game.players).filter(id => !game.players[id].isHost);
    if (playerIds.length > 0 && game.currentAskerId) {
      const currentAskerIndex = playerIds.indexOf(game.currentAskerId);
      const nextAskerIndex = (currentAskerIndex + 1) % playerIds.length;
      game.currentAskerId = playerIds[nextAskerIndex];
    }

    // Create a new phase for the next question
    const newPhase: Phase = {
        phaseNumber: game.currentPhaseNumber,
        questionAskerId: game.currentAskerId || '',
        question: '',
        llmResponse: '',
        submissions: {},
        isScored: false,
    };
    currentRound.phases.push(newPhase);

  }

  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/host`);
}
