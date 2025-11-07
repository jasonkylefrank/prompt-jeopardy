
"use client";

import { useState, useEffect } from "react";
import type { Game, User } from "@/lib/types";
import { useGameState } from "@/hooks/use-game-state";
import { Lobby } from "@/components/game/lobby";
import { GameBoard } from "@/components/game/game-board";
import { AppLogo } from "../icons";
import { Loader2 } from "lucide-react";

type ClientGameViewProps = {
  initialGame: Game;
};

export function ClientGameView({ initialGame }: ClientGameViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { game } = useGameState(initialGame);

  useEffect(() => {
    const storedPlayer = sessionStorage.getItem("player");
    if (storedPlayer) {
      setUser(JSON.parse(storedPlayer));
    }
    setLoading(false);
  }, []);


  if (loading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <AppLogo className="h-20 w-20 animate-pulse text-primary" />
        <p className="flex items-center gap-2 text-lg text-muted-foreground">
          <Loader2 className="animate-spin" /> Loading game...
        </p>
      </div>
    );
  }

  if (game.status === "lobby") {
    return <Lobby game={game} />;
  }

  return <GameBoard game={game} currentUser={user} />;
}
