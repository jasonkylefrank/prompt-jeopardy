
import { getGameState } from "@/app/actions";
import { ClientHostView } from "@/components/game/client-host-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { AppLogo } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type HostPageProps = {
  params: {
    gameId: string;
  };
};

// This will now be the Host page
export default async function HostPage({ params }: HostPageProps) {
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
            The game ID you entered doesn&apos;t exist or has expired.
          </AlertDescription>
        </Alert>
        <Button asChild>
            <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  return <ClientHostView initialGame={game} />;
}
