
export type QuestionType = 'single' | 'multiple' | 'boolean';

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options: Record<string, string>;
  correctAnswer: string; // "A" or "ABC" or "AB"
}

export interface Section {
  id: number;
  name: string;
  startId: number;
  endId: number;
  totalQuestions: number;
  category?: 'standard' | 'azimxon' | 'islomboy'; // Added islomboy
}

export interface UserAnswer {
  questionId: number;
  selectedOption: string | null; // Stores "A" or "ABC"
  isCorrect: boolean | null;
}

export type AppView = 'LANDING' | 'EXAM' | 'MULTIPLAYER';

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  score: number;
  totalTime: number; // in seconds
  currentAnswer: string | null;
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