"use client";

import { useState, useEffect, useCallback } from "react";
import type { Game } from "@/lib/types";
import { getGameState } from "@/app/actions";

export function useGameState(initialGame: Game) {
  const [game, setGame] = useState<Game>(initialGame);
  const [isPolling, setIsPolling] = useState(true);

  const fetchGame = useCallback(async () => {
    if (!game.id) return;
    const updatedGame = await getGameState(game.id);
    if (updatedGame) {
      setGame(updatedGame);
    }
  }, [game.id]);

  useEffect(() => {
    if (!isPolling || game.status === 'finished') {
      return;
    }

    const interval = setInterval(() => {
      fetchGame();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [isPolling, fetchGame, game.status]);

  const stopPolling = () => setIsPolling(false);
  const startPolling = () => setIsPolling(true);

  return { game, setGame, fetchGame, stopPolling, startPolling };
}
