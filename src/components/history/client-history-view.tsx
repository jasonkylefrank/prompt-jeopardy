
"use client";

import { useState } from "react";
import type { Game, Round, Player, Submission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Leaderboard } from "@/components/game/leaderboard";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trophy,
  Users,
} from "lucide-react";
import { AppLogo } from "../icons";
import { LLMResponseViewer } from "../game/llm-response-viewer";
import { ContestantCard } from "../game/contestant-card";

type GameStep = {
  type: "start" | "round_ask" | "round_answer" | "round_score";
  label: string;
  roundIndex?: number;
};

const generateSteps = (game: Game): GameStep[] => {
  const steps: GameStep[] = [{ type: "start", label: "Game Start" }];
  game.rounds.forEach((round, index) => {
    steps.push({
      type: "round_ask",
      label: `Round ${index + 1}: Question`,
      roundIndex: index,
    });
    steps.push({
      type: "round_answer",
      label: `Round ${index + 1}: Submissions`,
      roundIndex: index,
    });
    steps.push({
      type: "round_score",
      label: `Round ${index + 1}: Scoring`,
      roundIndex: index,
    });
  });
  return steps;
};

const calculateScoresAtStep = (game: Game, step: GameStep): Record<string, Player> => {
    const players = JSON.parse(JSON.stringify(game.players)) as Record<string, Player>;
    // Reset scores
    Object.values(players).forEach(p => p.score = 0);

    if (step.type === 'start') {
        return players;
    }

    const currentRoundIndex = step.roundIndex ?? -1;

    for (let i = 0; i <= currentRoundIndex; i++) {
        const round = game.rounds[i];
        if (!round) continue;

        // If we are before the scoring of the current round, only calculate up to the previous round
        if (i === currentRoundIndex && (step.type === 'round_ask' || step.type === 'round_answer')) {
            continue;
        }

        const { persona: correctPersona, action: correctAction } = round.correctAnswer;
        Object.entries(round.submissions).forEach(([playerId, submission]) => {
            if (players[playerId]) {
                const isPersonaCorrect = submission.persona === correctPersona;
                const isActionCorrect = submission.action === correctAction;
                let points = 0;
                if (isPersonaCorrect && isActionCorrect) points = 100;
                else if (isPersonaCorrect || isActionCorrect) points = 25;
                else points = -10;
                players[playerId].score += points;
            }
        });
    }

    return players;
}


export function ClientHistoryView({ game }: { game: Game }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps = generateSteps(game);
  const currentStep = steps[currentStepIndex];
  
  const playersAtStep = calculateScoresAtStep(game, currentStep);

  const handleNext = () =>
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  const handlePrev = () =>
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  const handleStart = () => setCurrentStepIndex(0);
  const handleEnd = () => setCurrentStepIndex(steps.length - 1);
  
  const round = typeof currentStep.roundIndex === 'number' ? game.rounds[currentStep.roundIndex] : undefined;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <header className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-4">
          <AppLogo className="h-12 w-12 text-primary" />
          <div>
            <h1 className="font-headline text-4xl font-bold">Game Review</h1>
            <p className="text-muted-foreground">
              Game ID:{" "}
              <span className="font-mono text-foreground">{game.id}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleStart} disabled={currentStepIndex === 0}><ChevronsLeft/></Button>
            <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentStepIndex === 0}><ChevronLeft/></Button>
            <span className="w-48 text-center text-sm font-medium">{currentStep.label} ({currentStepIndex + 1} / {steps.length})</span>
            <Button variant="outline" size="icon" onClick={handleNext} disabled={currentStepIndex === steps.length - 1}><ChevronRight/></Button>
            <Button variant="outline" size="icon" onClick={handleEnd} disabled={currentStepIndex === steps.length - 1}><ChevronsRight/></Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">
                        {currentStep.type === 'start' && 'Game Start'}
                        {currentStep.type === 'round_ask' && `Round ${currentStep.roundIndex! + 1}: The Question`}
                        {currentStep.type === 'round_answer' && `Round ${currentStep.roundIndex! + 1}: The AI Responds`}
                        {currentStep.type === 'round_score' && `Round ${currentStep.roundIndex! + 1}: The Results`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="min-h-[300px]">
                    {currentStep.type === 'start' && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">Welcome to the review of game <span className="font-mono text-primary">{game.id}</span>.</h2>
                            <p className="text-muted-foreground">Use the controls above to navigate through the game.</p>
                        </div>
                    )}
                    {round && (currentStep.type === 'round_ask' || currentStep.type === 'round_answer' || currentStep.type === 'round_score') && (
                        <>
                           <p className="mb-2 text-sm text-muted-foreground">Question by {game.players[round.questionAskerId]?.name}:</p>
                           <p className="mb-6 text-lg font-semibold">"{round.question}"</p>
                           <LLMResponseViewer
                                text={round.llmResponse}
                                isResponding={false}
                            />
                        </>
                    )}
                     {round && currentStep.type === 'round_answer' && (
                        <div className="mt-8">
                            <h3 className="mb-4 font-headline text-xl">Submissions</h3>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {Object.keys(game.players).filter(pid => !game.players[pid].isHost).map(playerId => (
                                    <Card key={playerId} className="p-3">
                                        <p className="font-bold">{game.players[playerId].name}</p>
                                        {round.submissions[playerId] ? (
                                            <div className="text-sm">
                                                <p>P: {round.submissions[playerId].persona}</p>
                                                <p>A: {round.submissions[playerId].action}</p>
                                            </div>
                                        ): <p className="text-sm text-muted-foreground">No submission</p>}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                    {round && currentStep.type === 'round_score' && (
                        <div className="mt-8 space-y-4">
                             <h3 className="font-headline text-xl">Results</h3>
                             <Card className="bg-green-900/50">
                                <CardContent className="p-4">
                                    <p className="text-sm">Correct Persona: <span className="font-bold">{round.correctAnswer.persona}</span></p>
                                    <p className="text-sm">Correct Action: <span className="font-bold">{round.correctAnswer.action}</span></p>
                                </CardContent>
                             </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Users /> Players
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    {Object.values(game.players).map((player) => (
                        <ContestantCard key={player.id} player={player} />
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Trophy className="text-amber-400" /> Leaderboard
                    </CardTitle>
                    <CardDescription>Scores as of this step</CardDescription>
                </CardHeader>
                <CardContent>
                    <Leaderboard players={Object.values(playersAtStep)} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
