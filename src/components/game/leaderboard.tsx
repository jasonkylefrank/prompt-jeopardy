"use client";

import type { Player } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Crown } from "lucide-react";

type LeaderboardProps = {
  players: Player[];
  horizontal?: boolean;
  compact?: boolean;
};

export function Leaderboard({ players, horizontal, compact }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  if (horizontal) {
    return (
        <div className={`flex gap-4 ${compact ? 'items-center' : 'flex-col'}`}>
            {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center gap-2">
                    <span className={`font-bold ${compact ? 'text-sm' : 'text-lg'}`}>{index + 1}.</span>
                     <Avatar className={`${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
                        <AvatarImage src={player.avatarUrl} alt={player.name} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className={`font-semibold ${compact ? 'text-sm' : ''}`}>{player.name}</p>
                        <p className={`font-bold text-primary ${compact ? 'text-xs' : 'text-sm'}`}>{player.score} pts</p>
                    </div>
                </div>
            ))}
        </div>
    )
  }


  return (
    <ol className="space-y-4">
      {sortedPlayers.map((player, index) => (
        <li
          key={player.id}
          className="flex items-center gap-4 rounded-md p-2 transition-colors"
        >
          <span className="text-xl font-bold text-muted-foreground">
            {index + 1}
          </span>
          <Avatar>
            <AvatarImage src={player.avatarUrl} alt={player.name} />
            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <p className="font-semibold">{player.name}</p>
          </div>
          <div className="flex items-center gap-1 font-bold text-primary">
            {index === 0 && <Crown className="h-5 w-5 text-amber-400" />}
            <span>{player.score} pts</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
