
export interface Player {
  id: string;
  name: string;
  score: number;
  isHost?: boolean;
}

export interface Submission {
  persona: string;
  action: string;
}

export interface Round {
  roundNumber: number;
  questionAskerId: string;
  question: string;
  llmResponse: string;
  submissions: Record<string, Submission>; // Player ID -> Submission
  isScored: boolean;
  correctAnswer: {
    persona: string;
    action: string;
  };
}

export type GameStatus =
  | "lobby"
  | "asking"
  | "responding"
  | "answering"
  | "scoring"
  | "finished";

export interface Game {
  id: string;
  hostId: string;
  hostName: string;
  status: GameStatus;
  players: Record<string, Player>; // Player ID -> Player
  rounds: Round[];
  currentRound: number;
  currentAskerId: string | null;
  liveQuestion: {
    text: string;
    persona: string;
    action: string;
  };
}

// Simplified user for client-side session
export interface User {
  id: string;
  name: string;
}
