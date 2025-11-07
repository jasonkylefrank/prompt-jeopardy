
import { getAllGames } from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppLogo } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

export default async function HistoryPage() {
  const games = await getAllGames();

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <header className="mb-8 flex flex-col items-center text-center">
        <AppLogo className="mb-4 h-16 w-16 text-primary" />
        <h1 className="font-headline text-5xl font-bold">Game History</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Review past games step-by-step.
        </p>
      </header>
      {games.length === 0 ? (
        <Card>
            <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No games have been played yet.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <Card key={game.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Game ID: <span className="font-mono text-primary">{game.id}</span>
                  </span>
                  <Button asChild variant="outline">
                    <Link href={`/history/${game.id}`}>
                      <History className="mr-2 h-4 w-4" />
                      Review Game
                    </Link>
                  </Button>
                </CardTitle>
                <CardDescription>
                  Played by {Object.keys(game.players).length} contestants.
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
