
import { getGameState } from "@/app/actions";
import { ClientHistoryView } from "@/components/history/client-history-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { AppLogo } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type HistoryGamePageProps = {
  params: {
    gameId: string;
  };
};

export default async function HistoryGamePage({ params }: HistoryGamePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const game = await getGameState(resolvedParams.gameId);

  if (!game) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
        <AppLogo className="h-20 w-20 text-primary" />
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle className="font-headline">Game Not Found</AlertTitle>
          <AlertDescription>
            The game ID you entered doesn&apos;t exist in the history.
          </AlertDescription>
        </Alert>
        <Button asChild>
            <Link href="/history">Return to History</Link>
        </Button>
      </div>
    );
  }

  return <ClientHistoryView game={game} />;
}
