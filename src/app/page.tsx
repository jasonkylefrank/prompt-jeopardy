"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGame, joinGame } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PartyPopper, Zap } from "lucide-react";
import { AppLogo } from "@/components/icons";
import { NameDialog } from "@/components/name-dialog";
import type { Player } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [gameId, setGameId] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"create" | "join" | null>(
    null
  );

  const handleCreateClick = () => {
    setCreateError(null);
    setDialogAction("create");
    setIsNameDialogOpen(true);
  };

  const handleJoinClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId) {
      setJoinError("Please enter a Game ID.");
      return;
    }
    setJoinError(null);
    setDialogAction("join");
    setIsNameDialogOpen(true);
  };

  const handleNameSubmit = async (name: string) => {
    // The user's ID is a simple random string for session identification
    const user: Omit<Player, "score" > = {
      id: Math.random().toString(36).substring(2, 9),
      name,
    };

    if (dialogAction === "create") {
      setLoading(true);
      try {
        // Explicitly set isHost for the host player
        const hostPlayer = { ...user, score: 0, isHost: true };
        const newGameId = await createGame(hostPlayer);
        // The host's info is also stored to identify them on the host page
        sessionStorage.setItem("player", JSON.stringify(hostPlayer));
        router.push(`/game/${newGameId}/host`);
      } catch (err) {
        console.error("Failed to create game:", err);
        setCreateError("Failed to create game. Please try again.");
        setLoading(false);
      }
    }

    if (dialogAction === "join") {
      setJoinLoading(true);
      try {
        const contestantPlayer = { ...user, score: 0, isHost: false };
        const result = await joinGame(gameId.toUpperCase(), contestantPlayer);

        if (!result.success) {
          setJoinError(result.message);
        } else {
          // Store contestant info for the session
          sessionStorage.setItem("player", JSON.stringify(contestantPlayer));
          router.push(`/game/${gameId.toUpperCase()}`);
        }
      } catch (err) {
        console.error("Failed to join game:", err);
        setJoinError("Failed to join game. Please check the ID and try again.");
      } finally {
        setJoinLoading(false);
      }
    }
  };

  return (
    <>
      <NameDialog
        isOpen={isNameDialogOpen}
        onOpenChange={setIsNameDialogOpen}
        onNameSubmit={handleNameSubmit}
        loading={loading || joinLoading}
      />
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center justify-center text-center">
          <AppLogo className="mb-4 h-20 w-20 text-primary" />
          <h1 className="font-headline text-5xl font-bold tracking-tighter md:text-7xl">
            Prompt Jeopardy
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground md:text-xl">
            A game of wit and AI deception. Can you guess the persona behind the
            prompt?
          </p>
        </div>

        <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <PartyPopper className="h-6 w-6 text-accent" />
                Set up a New Game
              </CardTitle>
              <CardDescription>
                Start a new game and invite your friends to play.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <p>
                As the host, you&apos;ll control the game, choose the AI&apos;s
                personality, and crown the winner.
              </p>
              {createError && <p className="text-sm text-destructive">{createError}</p>}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleCreateClick}
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-5 w-5" />
                )}
                Set up New Game
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <form onSubmit={handleJoinClick} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                  <Zap className="h-6 w-6 text-primary" />
                  Join an Existing Game
                </CardTitle>
                <CardDescription>
                  Enter the game ID from your host to join the fun.
                </CardDescription>
              </Header>
              <CardContent className="flex-grow space-y-4">
                <Label htmlFor="game-id">Game ID</Label>
                <Input
                  id="game-id"
                  placeholder="ABCDEF"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="text-center text-lg uppercase tracking-widest"
                  maxLength={6}
                  required
                />
                {joinError && <p className="text-sm text-destructive">{joinError}</p>}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={joinLoading}
                  size="lg"
                >
                  {joinLoading && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Join Game
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}
