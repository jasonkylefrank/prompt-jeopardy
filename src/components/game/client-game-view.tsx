"use client";

import type { Game } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useGameState } from "@/hooks/use-game-state";
import { Lobby } from "@/components/game/lobby";
import { GameBoard } from "@/components/game/game-board";
import { AppLogo } from "../icons";

type ClientGameViewProps = {
  initialGame: Game;
};

export function ClientGameView({ initialGame }: ClientGameViewProps) {
  const { user, loading: authLoading } = useAuth();
  const { game } = useGameState(initialGame);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <AppLogo className="h-20 w-20 animate-pulse text-primary" />
        <p className="text-lg text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  if (game.status === "lobby") {
    return <Lobby game={game} />;
  }

  return <GameBoard game={game} currentUser={user} />;
}
