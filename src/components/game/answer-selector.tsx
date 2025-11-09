
"use client";

import { useState, useEffect } from "react";
import { submitAnswer } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Timer } from "lucide-react";
import { Progress } from "../ui/progress";

type AnswerSelectorProps = {
  gameId: string;
  playerId: string;
  personaPool: string[];
  actionPool: string[];
  disabled: boolean;
};

const ANSWER_TIME = 30; // seconds

export function AnswerSelector({ gameId, playerId, personaPool, actionPool, disabled }: AnswerSelectorProps) {
  const [persona, setPersona] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME);

  useEffect(() => {
    if (timeLeft <= 0 || disabled) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, disabled]);

  const handleSubmit = async () => {
    if (!persona || !action) {
      toast({
        variant: "destructive",
        title: "Incomplete Answer",
        description: "Please select both a persona and an action.",
      });
      return;
    }
    setLoading(true);
    await submitAnswer(gameId, playerId, { persona, action });
    // The parent component will re-render based on game state change
  };

  const progress = (timeLeft / ANSWER_TIME) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">
          What's the Combo?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    <span>Time Left</span>
                </div>
                <span className="font-mono font-semibold">{timeLeft}s</span>
            </div>
            <Progress value={progress} />
        </div>
      
        <div className="space-y-2">
          <label htmlFor="persona-select">Persona</label>
          <Select value={persona} onValueChange={setPersona} disabled={disabled}>
            <SelectTrigger id="persona-select">
              <SelectValue placeholder="Select a persona..." />
            </SelectTrigger>
            <SelectContent>
              {personaPool.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="action-select">Action</label>
          <Select value={action} onValueChange={setAction} disabled={disabled}>
            <SelectTrigger id="action-select">
              <SelectValue placeholder="Select an action..." />
            </SelectTrigger>
            <SelectContent>
              {actionPool.map((a) => (
                <SelectItem key={a} value={a} className="whitespace-normal">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSubmit} disabled={loading || timeLeft <= 0 || disabled} className="w-full">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {disabled ? "Answer Locked" : timeLeft <=0 ? "Time's Up!" : "Lock In Answer"}
        </Button>
      </CardContent>
    </Card>
  );
}
