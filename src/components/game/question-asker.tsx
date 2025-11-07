
"use client";

import { useState, useEffect } from "react";
import { updateLiveQuestion, submitQuestion } from "@/app/actions";
import { Textarea } from "../ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2, PenSquare, Send } from "lucide-react";
import { Button } from "../ui/button";

type QuestionAskerProps = {
    gameId: string;
};

export function QuestionAsker({ gameId }: QuestionAskerProps) {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const debouncedQuestion = useDebounce(question, 300); // 300ms debounce delay

    useEffect(() => {
        // This effect runs when the debouncedQuestion changes
        // It prevents sending too many requests while the user is typing
        if (debouncedQuestion) {
            updateLiveQuestion(gameId, debouncedQuestion);
        }
    }, [debouncedQuestion, gameId]);

    const handleSubmit = async () => {
        setLoading(true);
        await submitQuestion(gameId);
        // The parent will re-render due to game state change, no need to setLoading(false) here
    }

    return (
        <Card className="bg-primary/10">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <PenSquare className="text-primary"/>
                    Your Turn to Ask!
                </CardTitle>
                <CardDescription>
                    Type your question for the AI below. When you're ready, submit it.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What is the meaning of life from the perspective of a pirate?"
                    className="text-lg"
                    rows={4}
                    autoFocus
                />
                <Button onClick={handleSubmit} disabled={loading || question.length < 5}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                    Submit Question
                </Button>
            </CardContent>
        </Card>
    );
}
