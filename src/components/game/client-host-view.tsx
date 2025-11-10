
"use client";

import {
  advanceToNextRound,
  scorePhase,
  finishGame,
  advanceAfterScoring
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
import { PERSONAS, ACTIONS } from "@/lib/constants";
import { useState, useEffect } from "react";
import { Leaderboard } from "./leaderboard";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Loader2,
  Copy,
  Users,
  Play,
  CheckCircle,
  ChevronRight,
  Eye,
  Settings,
  Flag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppLogo } from "../icons";
import Link from "next/link";
import type { User } from "@/lib/types";
import { MultiSelect } from "../ui/multi-select";
import { PlayerGrid } from "./player-grid";
import { GameInfoPanel } from "./game-info-panel";

export function ClientHostView({ initialGame }: { initialGame: Game }) {
  const { game } = useGameState(initialGame);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // State for setting up the NEXT round
  const [nextPersona, setNextPersona] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextPersonaPool, setNextPersonaPool] = useState<string[]>([]);
  const [nextActionPool, setNextActionPool] = useState<string[]>([]);


  useEffect(() => {
    const storedPlayer = sessionStorage.getItem("player");
    if (storedPlayer) {
      setUser(JSON.parse(storedPlayer));
    }
    // Pre-fill action pool, but leave persona pool empty by default.
    setNextActionPool(ACTIONS);
  }, []);

  const handleStartFirstRound = async () => {
    setLoading(true);
    if (!nextPersona || !nextAction || nextPersonaPool.length < 2 || nextActionPool.length < 2) {
        toast({
            variant: 'destructive',
            title: 'Setup Incomplete',
            description: 'Please select pools (min 2 each) and a correct persona/action for the first round.'
        })
        setLoading(false);
        return;
    }
    await advanceToNextRound(game.id, { persona: nextPersona, action: nextAction, personaPool: nextPersonaPool, actionPool: nextActionPool });
    resetRoundSetup();
    setLoading(false);
  };
  
  const handleScorePhase = async () => {
    setLoading(true);
    await scorePhase(game.id);
    setLoading(false);
  };

  const handleAdvanceAfterScoring = async () => {
    setLoading(true);
    await advanceAfterScoring(game.id);
    setLoading(false);
  }
  
  const handleStartNextRound = async () => {
    setLoading(true);
    if (!nextPersona || !nextAction || nextPersonaPool.length < 2 || nextActionPool.length < 2) {
        toast({
            variant: 'destructive',
            title: 'Setup Incomplete',
            description: 'Please select pools (min 2 each) and a correct persona/action for the next round.'
        })
        setLoading(false);
        return;
    }
    await advanceToNextRound(game.id, { persona: nextPersona, action: nextAction, personaPool: nextPersonaPool, actionPool: nextActionPool });
    resetRoundSetup();
    setLoading(false);
  }

  const handleFinishGame = async () => {
    setLoading(true);
    await finishGame(game.id);
    setLoading(false);
  }

  const resetRoundSetup = () => {
    setNextPersona('');
    setNextAction('');
    setNextPersonaPool([]);
    setNextActionPool(ACTIONS);
  }

  const players = Object.values(game.players).filter(p => !p.isHost);
  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRoundNumber);
  const currentPhase = currentRound?.phases.find(p => p.phaseNumber === game.currentPhaseNumber);

  const copyGameLink = () => {
    const url = `${window.location.origin}/game/${game.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Game link has been copied to your clipboard.",
    });
  };
  
  const isHost = user?.id === game.hostId;

  const renderRoundSetup = (title: string) => (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="flex items-center gap-2 font-headline text-lg font-semibold"><Settings /> {title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Persona Pool (select up to 6)</Label>
          <MultiSelect 
            options={PERSONAS}
            selected={nextPersonaPool} 
            onChange={setNextPersonaPool} 
            placeholder="Select personas for the pool..."
            max={6}
          />
        </div>
        <div className="space-y-2">
          <Label>Correct Persona</Label>
          <Select value={nextPersona} onValueChange={setNextPersona} disabled={nextPersonaPool.length === 0}>
            <SelectTrigger><SelectValue placeholder="Select correct persona..." /></SelectTrigger>
            <SelectContent>{nextPersonaPool.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Action Pool (select up to 5)</Label>
          <MultiSelect 
            options={ACTIONS} 
            selected={nextActionPool} 
            onChange={setNextActionPool} 
            placeholder="Select actions for the pool..."
            max={5}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Correct Action</Label>
          <Select value={nextAction} onValueChange={setNextAction} disabled={nextActionPool.length === 0}>
            <SelectTrigger><SelectValue placeholder="Select correct action..." /></SelectTrigger>
            <SelectContent>
              {nextActionPool.map(a => <SelectItem key={a} value={a} className="whitespace-normal">{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

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
                Current Status: <span className="font-semibold capitalize text-primary">{game.status.replace('-', ' ')}</span>
                {game.status !== 'lobby' && ` | Round: ${game.currentRoundNumber} | Phase: ${game.currentPhaseNumber}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {game.status === "lobby" && (
                <>
                  {renderRoundSetup("Setup First Round")}
                  <Button onClick={handleStartFirstRound} disabled={loading || players.length < 1}>
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
                    <p className="min-h-[40px] text-lg font-semibold italic">"{currentPhase?.question || '...'}"</p>
                 </div>
              )}
              {game.status === 'responding' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" />
                    <span>AI is thinking...</span>
                </div>
              )}
              {game.status === "answering" && (
                 <Button onClick={handleScorePhase} disabled={loading}>
                 {loading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                 <span>End Answering & Score Phase</span>
               </Button>
              )}
              {game.status === "scoring" && (
                 <Button onClick={handleAdvanceAfterScoring} disabled={loading}>
                   {loading ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                   <span>Continue</span>
                 </Button>
              )}
              {game.status === "round-finished" && (
                 <div>
                    {renderRoundSetup(`Setup Round ${game.currentRoundNumber + 1}`)}
                    <div className="mt-4 flex gap-4">
                      <Button onClick={handleStartNextRound} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                        <span>Start Next Round</span>
                      </Button>
                      <Button onClick={handleFinishGame} variant="destructive" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <Flag />}
                        <span>End Game</span>
                      </Button>
                    </div>
                 </div>
              )}
               {game.status === "game-finished" && (
                <div className="text-center">
                    <h3 className="font-headline text-2xl">Game Over!</h3>
                    <p className="text-muted-foreground">Thanks for playing.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Submissions */}
          {currentPhase && (game.status === 'answering' || game.status === 'scoring') && (
             <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Submissions</CardTitle>
                  <CardDescription>
                    See who has submitted their answers for Phase {currentPhase.phaseNumber}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    {players.map(player => (
                        <div key={player.id} className="flex items-center gap-2 rounded-lg border p-2">
                           <p className="font-semibold">{player.name}</p>
                            {currentPhase.submissions[player.id] ? (
                               <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                               <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            )}
                        </div>
                    ))}
                </CardContent>
             </Card>
          )}

        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Users /> Contestants ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerGrid players={players} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Leaderboard players={Object.values(game.players).filter(p => !p.isHost)} />
            </CardContent>
          </Card>
        </div>
         <div className="lg:col-span-3">
            {currentRound && <GameInfoPanel round={currentRound} />}
        </div>
      </div>
    </div>
  );
}
