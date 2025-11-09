
"use client";

import type { Game, User } from "@/lib/types";
import { LLMResponseViewer } from "./llm-response-viewer";
import { AnswerSelector } from "./answer-selector";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AppLogo } from "../icons";
import { Loader2, Trophy, PartyPopper } from "lucide-react";
import ConfettiFX from "./confetti-fx";
import { QuestionAsker } from "./question-asker";
import { GameInfoPanel } from "./game-info-panel";
import { PlayerGrid } from "./player-grid";
import { Leaderboard } from "./leaderboard";

type GameBoardProps = {
  game: Game;
  currentUser: User;
};

export function GameBoard({ game, currentUser }: GameBoardProps) {
  const players = Object.values(game.players).filter(p => !p.isHost);
  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRoundNumber);
  const currentPhase = currentRound?.phases.find(p => p.phaseNumber === game.currentPhaseNumber);
  const mySubmission = currentPhase?.submissions[currentUser.id];
  
  const wasCorrect = currentPhase?.isScored && mySubmission?.persona === currentRound?.correctAnswer.persona && mySubmission?.action === currentRound?.correctAnswer.action;
  const isMyTurnToAsk = game.currentAskerId === currentUser.id && game.status === 'asking';

  const renderStatusMessage = () => {
    switch (game.status) {
      case "asking":
        const askerName = game.players[game.currentAskerId || '']?.name || "a player";
        if (isMyTurnToAsk) {
          return "It's your turn to ask a question!";
        }
        return `Waiting for ${askerName} to ask a question...`;
      case "responding":
        return "The AI is formulating its response...";
      case "answering":
        if (mySubmission) {
          return "Answer locked in! Waiting for other players...";
        }
        return "Listen carefully and make your choice!";
      case "scoring":
         if (wasCorrect) return "You got it right! Nice work!";
        return "Phase over! Let's see the scores...";
      case "round-finished":
        return "Round complete! Waiting for the host to start the next round...";
      case "game-finished":
        return "Game Over! Thanks for playing!";
      default:
        return "Welcome to Prompt Jeopardy!";
    }
  };

  if (game.status === 'game-finished') {
    return (
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center p-4 text-center md:p-8">
            <PartyPopper className="mb-4 h-24 w-24 text-primary" />
            <h1 className="font-headline text-5xl font-bold">Game Over!</h1>
            <p className="mt-2 text-lg text-muted-foreground">Final Scores:</p>
            <div className="mt-8 w-full">
                <Leaderboard players={Object.values(game.players).filter(p => !p.isHost)} />
            </div>
        </div>
    )
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-7xl p-4 md:p-8">
      {wasCorrect && <ConfettiFX />}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AppLogo className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-3xl font-bold">
            Prompt Jeopardy
          </h1>
        </div>
        <div className="text-right">
            <p className="font-headline text-2xl font-bold">Round {game.currentRoundNumber}</p>
            <p className="text-sm text-muted-foreground">Phase {game.currentPhaseNumber}</p>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle className="font-headline text-2xl capitalize">
                {game.status.replace('-', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMyTurnToAsk ? (
                <QuestionAsker gameId={game.id} askerId={currentUser.id} />
              ) : (
                <>
                  {game.status === 'asking' && currentPhase && (
                    <div className="flex h-64 flex-col justify-center gap-4 text-center">
                        <p className="flex items-center justify-center gap-2 text-2xl text-muted-foreground"><Loader2 className="animate-spin" /> {renderStatusMessage()}</p>
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">Live question:</p>
                            <p className="min-h-[40px] text-lg font-semibold italic">"{currentPhase.question || '...'}"</p>
                        </div>
                    </div>
                  )}
                  {(game.status !== 'asking' && currentPhase) && (
                    <>
                        <p className="mb-2 text-sm text-muted-foreground">Question by {game.players[currentPhase.questionAskerId]?.name}:</p>
                        <p className="mb-6 text-lg font-semibold">"{currentPhase.question}"</p>
                        <LLMResponseViewer
                            text={currentPhase.llmResponse || ""}
                            isResponding={game.status === 'responding'}
                        />
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8 lg:col-span-1">
          {game.status === "answering" && currentRound && (
            <AnswerSelector 
              gameId={game.id} 
              playerId={currentUser.id} 
              personaPool={currentRound.personaPool}
              actionPool={currentRound.actionPool}
              disabled={!!mySubmission}
            />
          )}

           {(game.status !== "answering" || mySubmission) ? (
             <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Status</CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-[100px] items-center justify-center text-center text-muted-foreground">
                  <p className="flex items-center gap-2"><Loader2 className="animate-spin" /> {renderStatusMessage()}</p>
                </CardContent>
            </Card>
          ) : null}

          {game.status === 'scoring' && currentRound && currentPhase && (
             <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Phase Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Correct Persona</p>
                        <p className="font-semibold text-primary">{currentRound.correctAnswer.persona}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Correct Action</p>
                        <p className="font-semibold text-primary">{currentRound.correctAnswer.action}</p>
                    </div>
                    {mySubmission && (
                        <div className="rounded-lg border bg-secondary/50 p-3">
                            <p className="text-sm font-bold">Your Guess:</p>
                            <p>Persona: {mySubmission.persona}</p>
                            <p>Action: {mySubmission.action}</p>
                        </div>
                    )}
                    {wasCorrect && <p className="flex items-center gap-2 font-bold text-green-500"><Trophy/> Both correct! +100 Points!</p>}
                </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
            <PlayerGrid players={players} />
        </div>

         <div className="lg:col-span-3">
            {currentRound && <GameInfoPanel round={currentRound} />}
        </div>
      </main>
    </div>
  );
}
