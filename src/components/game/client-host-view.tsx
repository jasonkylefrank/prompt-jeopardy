
"use client";

import {
  advanceGameState,
  scoreRound,
  setRoundData,
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
import { ACTIONS, PERSONAS } from "@/lib/constants";
import { useState, useEffect } from "react";
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
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppLogo } from "../icons";
import Link from "next/link";
import type { User } from "@/lib/types";
import { MultiSelect } from "../ui/multi-select";

export function ClientHostView({ initialGame }: { initialGame: Game }) {
  const { game } = useGameState(initialGame);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [persona, setPersona] = useState(game.liveQuestion.persona || "");
  const [action, setAction] = useState(game.liveQuestion.action || "");
  const [personaPool, setPersonaPool] = useState<string[]>(game.liveQuestion.personaPool || []);
  const [actionPool, setActionPool] = useState<string[]>(game.liveQuestion.actionPool || ACTIONS);

  useEffect(() => {
    const storedPlayer = sessionStorage.getItem("player");
    if (storedPlayer) {
      setUser(JSON.parse(storedPlayer));
    }
  }, []);

  const handleAdvanceState = async (nextState: Game["status"]) => {
    setLoading(true);
    // For starting the game, pass the selected persona and action
    if (nextState === 'asking' && game.status === 'lobby') {
        if (!persona || !action || personaPool.length < 2 || actionPool.length < 2) {
            toast({
                variant: 'destructive',
                title: 'Setup Incomplete',
                description: 'Please select pools (min 2 each) and a correct persona/action for the first round.'
            })
            setLoading(false);
            return;
        }
        await advanceGameState(game.id, nextState, { persona, action, personaPool, actionPool });
    } else {
        await advanceGameState(game.id, nextState);
    }
    setLoading(false);
  };
  
  // Debounced update for round data
  useEffect(() => {
    const handler = setTimeout(() => {
      if (game.status === 'lobby' || game.status === 'scoring') {
        setRoundData(game.id, { persona, action, personaPool, actionPool });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [persona, action, personaPool, actionPool, game.id, game.status]);


  // Clear persona/action if they are no longer in the pool
  useEffect(() => {
    if (persona && !personaPool.includes(persona)) {
      setPersona('');
    }
  }, [personaPool, persona]);

  useEffect(() => {
    if (action && !actionPool.includes(action)) {
      setAction('');
    }
  }, [actionPool, action]);


  const handleScoreRound = async () => {
    setLoading(true);
    await scoreRound(game.id);
    // Reset for next round setup
    setPersona('');
    setAction('');
    setPersonaPool([]);
    setActionPool(ACTIONS); // Pre-select all actions for the next round
    setLoading(false);
  };
  
  const handleNextRound = async () => {
    setLoading(true);
    if (!persona || !action || personaPool.length < 2 || actionPool.length < 2) {
        toast({
            variant: 'destructive',
            title: 'Setup Incomplete',
            description: 'Please select pools (min 2 each) and a correct persona/action for the next round.'
        })
        setLoading(false);
        return;
    }
    await advanceGameState(game.id, 'asking', { persona, action, personaPool, actionPool });
    setLoading(false);
  }

  const handleSubmitQuestion = async () => {
    if (!game.liveQuestion.text || !game.liveQuestion.persona || !game.liveQuestion.action) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "A question, persona, and action are required to start the round.",
      });
      return;
    }
    setLoading(true);
    await submitQuestion(game.id);
    setLoading(false);
  };

  const players = Object.values(game.players).filter(p => !p.isHost);
  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRound);

  const copyGameLink = () => {
    const url = `${window.location.origin}/game/${game.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Game link has been copied to your clipboard.",
    });
  };
  
  const isHost = user?.id === game.hostId;

  const renderRoundSetup = (title: string) => {
    return (
      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="flex items-center gap-2 font-headline text-lg font-semibold"><Settings /> {title}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label>Persona Pool (select up to 6)</Label>
                <MultiSelect 
                    options={PERSONAS} 
                    selected={personaPool} 
                    onChange={setPersonaPool} 
                    placeholder="Select personas for the pool..."
                    max={6}
                />
            </div>
             <div className="space-y-2">
                <Label>Correct Persona</Label>
                <Select value={persona} onValueChange={setPersona} disabled={personaPool.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Select correct persona..." /></SelectTrigger>
                    <SelectContent>{personaPool.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label>Action Pool (select up to 5)</Label>
                <MultiSelect 
                    options={ACTIONS} 
                    selected={actionPool} 
                    onChange={setActionPool} 
                    placeholder="Select actions for the pool..."
                    max={5}
                />
            </div>
             <div className="space-y-2">
                <Label>Correct Action</Label>
                <Select value={action} onValueChange={setAction} disabled={actionPool.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Select correct action..." /></SelectTrigger>
                    <SelectContent>{actionPool.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!isHost) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
            <AppLogo className="h-20 w-20 text-primary" />
            <Card className="max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="font-headline">Access Denied</CardTitle>
                    <CardDescription>
                        Only the host can access this dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href={`/game/${game.id}`}>Go to Game</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <header className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-4">
          <AppLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="font-headline text-4xl font-bold">Host Dashboard</h1>
            <p className="text-muted-foreground">
              Game ID: <span className="font-mono text-foreground">{game.id}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" asChild>
                <Link href={`/game/${game.id}`} target="_blank">
                    <Eye className="mr-2"/>
                    <span>View as Contestant</span>
                </Link>
           </Button>
           <Label htmlFor="game-link" className="sr-only">Game Link</Label>
           <Input id="game-link" value={`${typeof window !== 'undefined' ? window.location.origin: ''}/game/${game.id}`} readOnly className="w-64"/>
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
                {game.status !== 'lobby' && ` | Round: ${game.currentRound}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {game.status === "lobby" && (
                <>
                  {renderRoundSetup("Setup First Round")}
                  <Button onClick={() => handleAdvanceState("asking")} disabled={loading || players.length < 1 || !persona || !action || personaPool.length < 2 || actionPool.length < 2}>
                    {loading ? <Loader2 className="animate-spin" /> : <Play />}
                    <span>Start Game</span>
                  </Button>
                  {players.length < 1 && <p className="text-sm text-muted-foreground">Waiting for at least 1 contestant to join.</p>}
                </>
              )}
              {game.status === "asking" && (
                 <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold">
                      Waiting for question from: <span className="font-bold">{game.players[game.currentAskerId || '']?.name || '...'}</span>
                    </h3>
                     <p className="text-muted-foreground">Live question:</p>
                    <p className="text-lg font-semibold italic">"{game.liveQuestion.text || '...'}"</p>
                    
                    <p className="text-sm text-muted-foreground">
                        Round Persona: <span className="font-semibold">{game.liveQuestion.persona}</span> | Action: <span className="font-semibold">{game.liveQuestion.action}</span>
                    </p>

                    <Button onClick={handleSubmitQuestion} disabled={loading || !game.liveQuestion.text}>
                      {loading ? <Loader2 className="animate-spin" /> : <Send />}
                      <span>Lock In Question & Start Answering</span>
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
                 <span>End Answering & Score Round</span>
               </Button>
              )}
              {game.status === "scoring" && (
                 <div>
                    {renderRoundSetup(`Setup Round ${game.currentRound + 1}`)}
                    <Button onClick={handleNextRound} className="mt-4" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                      <span>Start Next Round</span>
                    </Button>
                 </div>
              )}
            </CardContent>
          </Card>
          
          {/* Submissions */}
          {currentRound && (game.status === 'answering' || game.status === 'scoring' || game.status === 'finished') && (
             <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Submissions</CardTitle>
                  <CardDescription>
                    See who has submitted their answers for Round {currentRound.roundNumber}.
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
                <Users /> Contestants ({players.length})
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

    