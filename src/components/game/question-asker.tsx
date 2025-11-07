
"use client";

import { useState, useEffect } from "react";
import { updateLiveQuestion } from "@/app/actions";
import { Textarea } from "../ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { PenSquare } from "lucide-react";

type QuestionAskerProps = {
    gameId: string;
};

export function QuestionAsker({ gameId }: QuestionAskerProps) {
    const [question, setQuestion] = useState('');
    const debouncedQuestion = useDebounce(question, 300); // 300ms debounce delay

    useEffect(() => {
        // This effect runs when the debouncedQuestion changes
        // It prevents sending too many requests while the user is typing
        if (debouncedQuestion) {
            updateLiveQuestion(gameId, debouncedQuestion);
        }
    }, [debouncedQuestion, gameId]);

    return (
        <Card className="bg-primary/10">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <PenSquare className="text-primary"/>
                    Your Turn to Ask!
                </CardTitle>
                <CardDescription>
                    Type your question for the AI below. Everyone will see it as you type. The host will lock it in when you're ready.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What is the meaning of life from the perspective of a pirate?"
                    className="text-lg"
                    rows={4}
                    autoFocus
                />
            </CardContent>
        </Card>
    );
}
