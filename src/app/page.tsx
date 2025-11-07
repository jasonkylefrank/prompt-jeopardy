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
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PartyPopper, Zap, LogIn, LogOut } from "lucide-react";
import { AppLogo } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateGame = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const newGameId = await createGame({
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      });
      router.push(`/game/${newGameId}/admin`);
    } catch (err) {
      setError("Failed to create game. Please try again.");
      setLoading(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !gameId) return;
    setJoinLoading(true);
    setError(null);
    try {
      const result = await joinGame(gameId.toUpperCase(), {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      });

      if (!result.success) {
        setError(result.message);
        setJoinLoading(false);
      } else {
        router.push(`/game/${gameId.toUpperCase()}`);
      }
    } catch (err) {
      setError("Failed to join game. Please check the ID and try again.");
      setJoinLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        {authLoading ? (
          <Button variant="outline" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        ) : user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-right">
              <span className="font-semibold">{user.name}</span>
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button onClick={signIn}>
            <LogIn className="mr-2" />
            Login with Google
          </Button>
        )}
      </div>

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
              Create a New Game
            </CardTitle>
            <CardDescription>
              Start a new game and invite your friends to play.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>
              As the host, you&apos;ll control the game, choose the AI&apos;s
              personality, and crown the winner.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleCreateGame}
              disabled={loading || authLoading || !user}
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Zap className="mr-2 h-5 w-5" />
              )}
              {authLoading
                ? "Authenticating..."
                : !user
                ? "Please Log In"
                : "Create Game"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <form onSubmit={handleJoinGame} className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Zap className="h-6 w-6 text-primary" />
                Join an Existing Game
              </CardTitle>
              <CardDescription>
                Enter the game ID from your host to join the fun.
              </CardDescription>
            </CardHeader>
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
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={joinLoading || authLoading || !user}
                size="lg"
              >
                {joinLoading && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                {authLoading
                  ? "Authenticating..."
                  : !user
                  ? "Please Log In"
                  : "Join Game"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
