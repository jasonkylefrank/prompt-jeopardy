
"use client";

import { useState, useEffect, useMemo } from "react";

const WORD_DELAY_MS = 150;

export function useTypedSpeech(fullText: string) {
  const [displayedText, setDisplayedText] = useState("");
  const words = useMemo(() => fullText?.split(" ") || [], [fullText]);

  useEffect(() => {
    if (!fullText) {
      setDisplayedText("");
      return;
    }

    setDisplayedText(""); // Reset on new text
    let wordIndex = 0;
    
    const intervalId = setInterval(() => {
      if (wordIndex < words.length) {
        setDisplayedText((prev) => prev + (wordIndex > 0 ? " " : "") + words[wordIndex]);
        wordIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, WORD_DELAY_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [fullText, words]);

  // isSpeaking is now a dummy value since we removed speech synthesis
  return { displayedText, isSpeaking: false };
}
