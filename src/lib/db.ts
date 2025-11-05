// MOCK DATABASE for demonstration purposes.
// In a real application, you would replace this with a connection to a database like Firestore.
// This in-memory store will be reset on every server restart.

import type { Game } from './types';

const games: Record<string, Game> = {};

export async function getGame(id: string): Promise<Game | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  return games[id] ? JSON.parse(JSON.stringify(games[id])) : null;
}

export async function saveGame(game: Game): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  games[game.id] = JSON.parse(JSON.stringify(game));
}
