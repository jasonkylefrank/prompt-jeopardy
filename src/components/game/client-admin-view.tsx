"use client";

import {
  advanceGameState,
  scoreRound,
  submitQuestion,
} from "@/app/actions";
import type { Game } from "@/lib/types";
import { useGameState } from "@/hooks/use-game-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ACTIONS, PERSONAS } from "@/lib/constants";
import { useState } from "react";
import { Leaderboard } from "./leaderboard";
import { ContestantCard } from "./contestant-card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Loader2,
  Copy,
  Users,
  Send,
  Play,
  CheckCircle,
  Trophy,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppLogo } from "../icons";
import Link from "next/link";

export function ClientAdminView({ initialGame }: { initialGame: Game }) {
  const { game } = useGameState(initialGame);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [question, setQuestion] = useState("");
  const [persona, setPersona] = useState("");
  const [action, setAction] = useState("");

  const handleAdvanceState = async (nextState: Game["status"]) => {
    setLoading(true);
    await advanceGameState(game.id, nextState);
    setLoading(false);
  };

  const handleScoreRound = async () => {
    setLoading(true);
    await scoreRound(game.id);
    setLoading(false);
  };

  const handleSubmitQuestion = async () => {
    if (!question || !persona || !action) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a question, persona, and action.",
      });
      return;
    }
    setLoading(true);
    await submitQuestion(game.id, { question, persona, action });
    // State will be advanced by server action after LLM response
    setQuestion("");
    setPersona("");
    setAction("");
    setLoading(false);
  };

  const players = Object.values(game.players);
  const currentRound = game.rounds[game.rounds.length - 1];

  const copyGameLink = () => {
    const url = `${window.location.origin}/game/${game.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Game link has been copied to your clipboard.",
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <header className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-4">
          <AppLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="font-headline text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Game ID: <span className="font-mono text-foreground">{game.id}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" asChild>
                <Link href={`/game/${game.id}`} target="_blank">
                    <Eye />
                    <span>View as Contestant</span>
                </Link>
           </Button>
           <Label htmlFor="game-link" className="sr-only">Game Link</Label>
           <Input id="game-link" value={`${window.location.origin}/game/${game.id}`} readOnly className="w-64"/>
          <Button variant="outline" size="icon" onClick={copyGameLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Game State Controller */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Game Control</CardTitle>
              <CardDescription>
                Current Status: <span className="font-semibold text-primary">{game.status.toUpperCase()}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {game.status === "lobby" && (
                <Button onClick={() => handleAdvanceState("asking")} disabled={loading || players.length < 1}>
                  {loading ? <Loader2 className="animate-spin" /> : <Play />}
                  <span>Start Game</span>
                </Button>
              )}
              {game.status === "asking" && (
                 <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold">
                      Round {game.currentRound + 1}: Ask a Question
                    </h3>
                    <p>Current Asker: <span className="font-bold">{game.players[game.currentAskerId]?.name || ''}</span></p>
                    <Textarea placeholder="Enter the contestant's question here..." value={question} onChange={e => setQuestion(e.target.value)} />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Select value={persona} onValueChange={setPersona}>
                          <SelectTrigger><SelectValue placeholder="Select Persona" /></SelectTrigger>
                          <SelectContent>{PERSONAS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={action} onValueChange={setAction}>
                          <SelectTrigger><SelectValue placeholder="Select Action" /></SelectTrigger>
                          <SelectContent>{ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSubmitQuestion} disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : <Send />}
                      <span>Generate Response & Start Answering</span>
                    </Button>
                 </div>
              )}
              {game.status === 'responding' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" />
                    <span>AI is thinking...</span>
                </div>
              )}
              {game.status === "answering" && (
                <Button onClick={handleScoreRound} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                  <span>Score Round</span>
                </Button>
              )}
              {game.status === "scoring" && (
                 <Button onClick={() => handleAdvanceState("asking")} disabled={loading}>
                   {loading ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                   <span>Next Round</span>
                 </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Submissions */}
          {currentRound && (
             <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Submissions</CardTitle>
                  <CardDescription>
                    Round {currentRound.roundNumber}: See who has submitted their answers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {players.map(player => (
                        <div key={player.id} className="flex flex-col items-center text-center">
                            <ContestantCard player={player} />
                            {currentRound.submissions[player.id] ? (
                               <CheckCircle className="mt-2 h-6 w-6 text-green-500" />
                            ) : (
                               <Loader2 className="mt-2 h-6 w-6 animate-spin text-muted-foreground" />
                            )}
                            <p className="text-sm text-muted-foreground">
                                {currentRound.submissions[player.id] ? "Submitted" : "Awaiting"}
                            </p>
                        </div>
                    ))}
                  </div>
                </CardContent>
             </Card>
          )}

        </div>

        <div className="space-y-8">
          {/* Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Users /> Players ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {players.map((player) => (
                <ContestantCard key={player.id} player={player} />
              ))}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Trophy className="text-amber-400"/> Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Leaderboard players={players} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
