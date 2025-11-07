
"use client";

import type { Game, User } from "@/lib/types";
import { LLMResponseViewer } from "./llm-response-viewer";
import { AnswerSelector } from "./answer-selector";
import { Leaderboard } from "./leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AppLogo } from "../icons";
import { Loader2, Trophy } from "lucide-react";
import ConfettiFX from "./confetti-fx";
import { QuestionAsker } from "./question-asker";

type GameBoardProps = {
  game: Game;
  currentUser: User;
};

export function GameBoard({ game, currentUser }: GameBoardProps) {
  const players = Object.values(game.players);
  const currentRound = game.rounds.find(r => r.roundNumber === game.currentRound);
  const mySubmission = currentRound?.submissions[currentUser.id];
  
  const wasCorrect = currentRound?.isScored && mySubmission?.persona === currentRound.correctAnswer.persona && mySubmission?.action === currentRound.correctAnswer.action;
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
        return "Round over! Let's see the scores...";
      default:
        return "Welcome to Prompt Jeopardy!";
    }
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-7xl p-4 md:p-8">
      {wasCorrect && <ConfettiFX />}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AppLogo className="h-10 w-10 text-primary" />
          <h1 className="hidden font-headline text-3xl font-bold md:block">
            Prompt Jeopardy
          </h1>
        </div>
        <Card>
          <CardContent className="p-3">
             <Leaderboard players={players} horizontal compact />
          </CardContent>
        </Card>
      </header>

      <main className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">
                Round {game.currentRound}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMyTurnToAsk ? (
                <QuestionAsker gameId={game.id} />
              ) : (
                <>
                  {game.status === 'asking' && (
                    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center text-muted-foreground">
                        <p className="flex items-center gap-2 text-2xl"><Loader2 className="animate-spin" /> {renderStatusMessage()}</p>
                        <p className="text-lg font-semibold italic">"{game.liveQuestion.text || '...'}"</p>
                    </div>
                  )}
                  {(game.status !== 'asking') && (
                    <>
                        <p className="mb-2 text-sm text-muted-foreground">Question:</p>
                        <p className="mb-6 text-lg font-semibold">"{currentRound?.question || game.liveQuestion.text}"</p>
                        <LLMResponseViewer
                            text={currentRound?.llmResponse || ""}
                            isResponding={game.status === 'responding'}
                        />
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {game.status === "answering" && !mySubmission && currentRound && (
            <AnswerSelector 
              gameId={game.id} 
              playerId={currentUser.id} 
              personaPool={currentRound.personaPool}
              actionPool={currentRound.actionPool}
            />
          )}

          {game.status !== "answering" || (game.status === "answering" && mySubmission) ? (
             <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Status</CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-[100px] items-center justify-center text-center text-muted-foreground">
                  <p className="flex items-center gap-2"><Loader2 className="animate-spin" /> {renderStatusMessage()}</p>
                </CardContent>
            </Card>
          ) : null}

          {game.status === 'scoring' && currentRound && (
             <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Round Results</CardTitle>
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
      </main>
    </div>
  );
}
