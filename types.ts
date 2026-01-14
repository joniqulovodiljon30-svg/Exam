
export interface Question {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface Section {
  id: number;
  name: string;
  startId: number;
  endId: number;
  totalQuestions: number;
}

export interface UserAnswer {
  questionId: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean | null;
}

export type AppView = 'LANDING' | 'EXAM' | 'MULTIPLAYER';

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  score: number;
  totalTime: number; // in seconds
  currentAnswer: 'A' | 'B' | 'C' | 'D' | null;
  avatarColor: string;
  isBot?: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}
