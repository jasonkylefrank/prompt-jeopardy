
"use client";

import type { Player } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown } from "lucide-react";

type ContestantCardProps = {
  player: Player;
  horizontal?: boolean;
};

export function ContestantCard({ player, horizontal = false }: ContestantCardProps) {
  return (
    <div
      className={`flex items-center gap-2 ${
        horizontal ? "flex-row" : "flex-col"
      }`}
    >
      <div className="relative">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
        </Avatar>
        {player.isHost && (
          <Crown className="absolute -top-2 -right-2 h-5 w-5 rotate-12 fill-amber-400 text-amber-500" />
        )}
      </div>
      <div className={horizontal ? "text-left" : "text-center"}>
        <p className="font-semibold">{player.name}</p>
        {!horizontal && (
           <p className="text-sm font-bold text-primary">{player.score} pts</p>
        )}
      </div>
    </div>
  );
}
