
"use server";

import { revalidatePath } from "next/cache";
import { getGame, saveGame } from "@/lib/db";
import type { Game, Player, Submission } from "@/lib/types";
import { generateLLMResponse as generateLLMResponseFlow } from "@/ai/flows/generate-llm-response";

// --- GAME CREATION AND JOINING ---

export async function createGame(host: {
  id: string;
  name: string;
  avatarUrl: string;
}): Promise<string> {
  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const hostPlayer: Player = { ...host, score: 0, isHost: true };

  const newGame: Game = {
    id: gameId,
    hostId: host.id,
    status: "lobby",
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
  playerData: { id: string; name: string; avatarUrl: string }
): Promise<{ success: boolean; message: string }> {
  const game = await getGame(gameId);
  if (!game) {
    return { success: false, message: "Game not found." };
  }

  if (game.status !== "lobby") {
    return { success: false, message: "Game has already started." };
  }

  if (!game.players[playerData.id]) {
    game.players[playerData.id] = { ...playerData, score: 0 };
    await saveGame(game);
  }

  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/admin`);
  return { success: true, message: "Joined game." };
}

// --- GAME STATE MANAGEMENT ---

export async function getGameState(gameId: string): Promise<Game | null> {
  return await getGame(gameId);
}

export async function advanceGameState(
  gameId: string,
  newStatus: Game["status"]
) {
  const game = await getGame(gameId);
  if (!game) return;

  game.status = newStatus;

  // Logic for advancing rounds
  if (newStatus === "asking") {
    const playerIds = Object.keys(game.players);
    const currentAskerIndex = playerIds.indexOf(game.currentAskerId);
    const nextAskerIndex = (currentAskerIndex + 1) % playerIds.length;
    game.currentAskerId = playerIds[nextAskerIndex];

    if (nextAskerIndex === 0) {
      game.currentRound += 1;
    }
  }

  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/admin`);
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
  const game = await getGame(gameId);
  if (!game) return;

  game.status = "responding";
  const newRound = {
    roundNumber: game.currentRound + 1,
    questionAskerId: game.currentAskerId,
    question,
    persona,
    action,
    llmResponse: "",
    submissions: {},
    isScored: false,
    correctAnswer: { persona, action },
  };
  game.rounds.push(newRound);

  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/admin`);

  // Start LLM response generation asynchronously
  generateAndSaveLLMResponse(gameId, question, persona, action);
}

async function generateAndSaveLLMResponse(
  gameId: string,
  question: string,
  persona: string,
  action: string
) {
  const game = await getGame(gameId);
  if (!game) return;

  const llmResult = await generateLLMResponseFlow({
    question,
    persona,
    action,
  });

  const currentRound = game.rounds[game.rounds.length - 1];
  if (currentRound) {
    currentRound.llmResponse = llmResult.response;
    game.status = "answering";
    await saveGame(game);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/admin`);
  }
}

export async function submitAnswer(
  gameId: string,
  playerId: string,
  submission: Submission
) {
  const game = await getGame(gameId);
  if (!game || game.status !== "answering") return;

  const currentRound = game.rounds[game.rounds.length - 1];
  if (currentRound && !currentRound.submissions[playerId]) {
    currentRound.submissions[playerId] = submission;
    await saveGame(game);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/game/${gameId}/admin`);
  }
}

export async function scoreRound(gameId: string) {
  const game = await getGame(gameId);
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
  game.status = "scoring";
  await saveGame(game);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/dmin`);
}
