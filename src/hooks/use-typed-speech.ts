"use client";

import { useState, useEffect, useMemo } from "react";

const WORD_DELAY_MS = 150;

export function useTypedSpeech(fullText: string) {
  const [displayedText, setDisplayedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const words = useMemo(() => fullText?.split(" ") || [], [fullText]);

  useEffect(() => {
    if (!fullText) {
      setDisplayedText("");
      return;
    }

    setDisplayedText(""); // Reset on new text
    let wordIndex = 0;
    let speechSynth: SpeechSynthesis | null = null;
    if (typeof window !== 'undefined') {
        speechSynth = window.speechSynthesis;
    }

    const speak = (word: string) => {
        if (!speechSynth) return;
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        speechSynth.speak(utterance);
    }

    const intervalId = setInterval(() => {
      if (wordIndex < words.length) {
        setDisplayedText((prev) => prev + (wordIndex > 0 ? " " : "") + words[wordIndex]);
        speak(words[wordIndex]);
        wordIndex++;
      } else {
        clearInterval(intervalId);
        setIsSpeaking(false);
      }
    }, WORD_DELAY_MS);

    return () => {
      clearInterval(intervalId);
      if (speechSynth) speechSynth.cancel();
      setIsSpeaking(false);
    };
  }, [fullText, words]);

  return { displayedText, isSpeaking };
}
