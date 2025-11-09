
"use client";

import { useState, useEffect } from "react";
import { submitQuestion } from "@/app/actions";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2, PenSquare, Send } from "lucide-react";
import { Button } from "../ui/button";
import { useDebounce } from "@/hooks/use-debounce";

type QuestionAskerProps = {
    gameId: string;
    askerId: string;
};

export function QuestionAsker({ gameId, askerId }: QuestionAskerProps) {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const debouncedQuestion = useDebounce(question, 500);

    // Effect to send live updates
    useEffect(() => {
        // Don't send initial empty string or if user has submitted
        if (debouncedQuestion && !loading) {
            submitQuestion(gameId, debouncedQuestion, askerId, false);
        }
    }, [debouncedQuestion, gameId, askerId, loading]);


    const handleSubmit = async () => {
        if (question.trim().length < 5) return;
        setLoading(true);
        try {
            await submitQuestion(gameId, question, askerId, true);
        } catch (error) {
            console.error("Failed to submit question:", error);
            setLoading(false); // Only reset loading on error
        }
        // The parent will re-render due to game state change, no need to setLoading(false) here on success
    }

    return (
        <Card className="bg-primary/10">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <PenSquare className="text-primary"/>
                    Your Turn to Ask!
                </CardTitle>
                <CardDescription>
                    Type your question for the AI below. When you're ready, submit it to lock it in.
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
