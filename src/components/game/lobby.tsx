"use client";

import type { Game } from "@/lib/types";
import { ContestantCard } from "./contestant-card";
import { AppLogo } from "../icons";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Copy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type LobbyProps = {
  game: Game;
};

export function Lobby({ game }: LobbyProps) {
  const { toast } = useToast();
  const players = Object.values(game.players);

  const copyGameId = () => {
    navigator.clipboard.writeText(game.id);
    toast({
      title: "Game ID Copied!",
      description: "The game ID has been copied to your clipboard.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <AppLogo className="mb-4 h-20 w-20 text-primary" />
      <h1 className="font-headline text-5xl font-bold">Waiting for Host...</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        The game will begin shortly.
      </p>

      <Card className="mt-8 w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-xl font-semibold">
            Game ID: <span className="font-mono text-primary">{game.id}</span>
            <Button variant="ghost" size="icon" onClick={copyGameId}>
              <Copy className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-muted-foreground">
            <Users /> Players in Lobby ({players.length})
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {players.map((player) => (
              <ContestantCard key={player.id} player={player} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
