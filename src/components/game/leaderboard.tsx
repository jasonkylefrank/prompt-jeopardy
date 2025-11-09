
"use client";

import type { Player } from "@/lib/types";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Crown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LeaderboardProps = {
  players: Player[];
};

export function Leaderboard({ players }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPlayers.map((player, index) => (
          <TableRow key={player.id} className={index === 0 && sortedPlayers[0].score > 0 ? "bg-amber-500/10" : ""}>
            <TableCell className="font-bold">
              <div className="flex items-center gap-2">
                {index === 0 && sortedPlayers[0].score > 0 && <Crown className="h-5 w-5 text-amber-400" />}
                <span>{index + 1}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{player.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-mono font-bold text-primary">
              {player.score} pts
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
