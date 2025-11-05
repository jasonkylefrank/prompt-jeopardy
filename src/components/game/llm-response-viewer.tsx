"use client";

import { useTypedSpeech } from "@/hooks/use-typed-speech";
import { Loader2, Volume2 } from "lucide-react";

type LLMResponseViewerProps = {
  text: string;
  isResponding: boolean;
};

export function LLMResponseViewer({
  text,
  isResponding,
}: LLMResponseViewerProps) {
  const { displayedText, isSpeaking } = useTypedSpeech(text);

  if (isResponding) {
    return (
      <div className="flex h-32 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-lg">AI is generating a response...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
        <span>AI Response:</span>
      </div>
      <p className="min-h-[96px] text-xl/relaxed font-medium text-foreground">
        {displayedText}
      </p>
    </div>
  );
}
