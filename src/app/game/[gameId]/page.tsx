
import { getGameState } from "@/app/actions";
import { ClientGameView } from "@/components/game/client-game-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

type GamePageProps = {
  params: {
    gameId: string;
  };
};

export default async function GamePage({ params }: GamePageProps) {
  // In Next.js 15, params is a promise.
  const resolvedParams = await Promise.resolve(params);
  const game = await getGameState(resolvedParams.gameId);

  if (!game) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle className="font-headline">Game Not Found</AlertTitle>
          <AlertDescription>
            The game ID you entered doesn&apos;t exist or has expired. Please
            check the ID and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <ClientGameView initialGame={game} />;
}
