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
  const [user, setUser] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRejoinDialogOpen, setIsRejoinDialogOpen] = useState(false);
  const [rejoinLoading, setRejoinLoading] = useState(false);
  const { game } = useGameState(initialGame);

  useEffect(() => {
    // Check if player info is in session storage
    const storedPlayer = sessionStorage.getItem("player");
    if (storedPlayer) {
      try {
        const playerData: Player = JSON.parse(storedPlayer);
        // Verify this player is actually in the game state
        if (game.players[playerData.id] || game.hostId === playerData.id) {
          setUser(playerData);
        } else {
          // Stale player data, prompt to join
          setIsRejoinDialogOpen(true);
        }
      } catch (error) {
        console.error("Error parsing player data from session storage", error);
        sessionStorage.removeItem("player");
        setIsRejoinDialogOpen(true);
      }
    } else {
      // If no player in session, prompt them to "re-join" by entering their name
      setIsRejoinDialogOpen(true);
    }
    setLoading(false);
  }, [game.players, game.hostId]);

  const handleRejoin = async (name: string) => {
    setRejoinLoading(true);
    try {
        const player: Omit<Player, "score"> = {
            id: Math.random().toString(36).substring(2, 9),
            name,
        };
        const newPlayer = { ...player, score: 0, isHost: false };
        const result = await joinGame(game.id, newPlayer);
        if (result.success) {
            sessionStorage.setItem("player", JSON.stringify(newPlayer));
            setUser(newPlayer);
            setIsRejoinDialogOpen(false);
        } else {
            console.error("Failed to rejoin game:", result.message);
        }
    } finally {
        setRejoinLoading(false);
    }
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

  // If we are still waiting for a user to identify themselves
  if (!user && isRejoinDialogOpen) {
    return (
      <>
        <NameDialog
          isOpen={isRejoinDialogOpen}
          onOpenChange={(open) => {
            // Prevent closing the dialog by clicking outside or pressing Escape
            if (!open) return;
            setIsRejoinDialogOpen(open);
          }}
          onNameSubmit={handleRejoin}
          loading={rejoinLoading}
        />
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
          <AppLogo className="h-20 w-20 text-primary" />
          <p className="text-lg text-muted-foreground">
            Please enter your name to join the game.
          </p>
        </div>
      </>
    );
  }
  
  if (!user) {
    return <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin" /> Verifying...
    </div>
  }

  if (game.status === "lobby") {
    return <Lobby game={game} />;
  }

  return <GameBoard game={game} currentUser={user} />;
}
