
"use client";

import type { Game } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { List, Info, CircleDollarSign } from "lucide-react";

export function GameInfoPanel({ game }: { game: Game }) {
  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRound);
  const personaPool = currentRound?.personaPool || game.liveQuestion.personaPool || [];
  const actionPool = currentRound?.actionPool || game.liveQuestion.actionPool || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            <Info />
            Game Information
        </CardTitle>
        <CardDescription>
          Key details about the current round.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold text-muted-foreground"><List /> Possible Personas</h3>
            <div className="flex flex-wrap gap-2">
                {personaPool.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
            </div>
        </div>
        <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold text-muted-foreground"><List /> Possible Actions</h3>
            <div className="flex flex-col gap-2">
                {actionPool.map(a => <Badge key={a} variant="outline" className="h-auto whitespace-normal text-left">{a}</Badge>)}
            </div>
        </div>
        <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold text-muted-foreground"><CircleDollarSign /> Point Consequences</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
                <li><span className="font-bold text-green-500">+100 pts:</span> Correct Persona & Action</li>
                <li><span className="font-bold text-yellow-500">+25 pts:</span> Correct Persona OR Action</li>
                <li><span className="font-bold text-red-500">-10 pts:</span> Incorrect Persona & Action</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}
