
"use client";

import { useState, useEffect } from "react";
import type { Game, User, Player } from "@/lib/types";
import { useGameState } from "@/hooks/use-game-state";
import { Lobby } from "@/components/game/lobby";
import { GameBoard } from "@/components/game/game-board";
import { AppLogo } from "../icons";
import { Loader2 } from "lucide-react";
import { NameDialog } from "../name-dialog";
import { joinGame } from "@/app/actions";

type ClientGameViewProps = {
  initialGame: Game;
};

export function ClientGameView({ initialGame }: ClientGameViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRejoinDialogOpen, setIsRejoinDialogOpen] = useState(false);
  const { game } = useGameState(initialGame);

  useEffect(() => {
    const storedPlayer = sessionStorage.getItem("player");
    if (storedPlayer) {
      setUser(JSON.parse(storedPlayer));
      setLoading(false);
    } else {
      // If no player in session, prompt them to "re-join" by entering their name
      setLoading(false);
      setIsRejoinDialogOpen(true);
    }
  }, []);

  const handleRejoin = async (name: string) => {
     const player: Omit<Player, "score"> = {
      id: Math.random().toString(36).substring(2, 9),
      name,
    };
    await joinGame(game.id, player);
    sessionStorage.setItem("player", JSON.stringify(player));
    setUser(player);
    setIsRejoinDialogOpen(false);
  };


  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <AppLogo className="h-20 w-20 animate-pulse text-primary" />
        <p className="flex items-center gap-2 text-lg text-muted-foreground">
          <Loader2 className="animate-spin" /> Loading game...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <NameDialog
          isOpen={isRejoinDialogOpen}
          onOpenChange={setIsRejoinDialogOpen}
          onNameSubmit={handleRejoin}
          loading={false}
        />
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
          <AppLogo className="h-20 w-20 text-primary" />
          <p className="text-lg text-muted-foreground">
            Please enter your name to join.
          </p>
        </div>
      </>
    );
  }

  if (game.status === "lobby") {
    return <Lobby game={game} />;
  }

  return <GameBoard game={game} currentUser={user} />;
}
