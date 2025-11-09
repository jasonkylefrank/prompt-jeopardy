

export interface User {
  id: string;
  name: string;
}

export interface Player extends User {
  score: number;
  isHost?: boolean;
}

export interface Submission {
  persona: string;
  action: string;
}

export interface Phase {
  phaseNumber: number;
  questionAskerId: string;
  question: string;
  llmResponse: string;
  submissions: Record<string, Submission>; // Player ID -> Submission
  isScored: boolean;
}

export interface Round {
  roundNumber: number;
  correctAnswer: {
    persona: string;
    action: string;
  };
  personaPool: string[];
  actionPool: string[];
  phases: Phase[];
}

export type GameStatus =
  | "lobby"
  | "asking" // A player is asking a question
  | "responding" // The LLM is generating a response
  | "answering" // Players are submitting their answers
  | "scoring" // Scores for the phase are being displayed
  | "round-finished" // A round is over, waiting for host to start next
  | "game-finished";

export interface Game {
  id: string;
  hostId: string;
  hostName: string;
  status: GameStatus;
  players: Record<string, Player>; // Player ID -> Player
  rounds: Round[];
  currentRoundNumber: number;
  currentPhaseNumber: number;
  currentAskerId: string | null;
}
