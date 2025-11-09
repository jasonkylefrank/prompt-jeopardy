
"use client";

import type { Player } from "@/lib/types";
import { ContestantCard } from "./contestant-card";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users } from "lucide-react";

type PlayerGridProps = {
  players: Player[];
};

export function PlayerGrid({ players }: PlayerGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <Users /> Contestants ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {players.map((player) => (
          <ContestantCard key={player.id} player={player} />
        ))}
      </CardContent>
    </Card>
  );
}
