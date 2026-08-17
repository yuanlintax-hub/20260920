export interface QuizQuestion {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export type GameScreen = "HOME" | "QUIZ" | "PINBALL" | "RESULT" | "SUCCESS";

export interface GameRoundState {
  currentRound: number; // 1 or 2
  questions: QuizQuestion[];
  answers: {
    selectedOption: string | null;
    isCorrect: boolean;
    earnedGoldBall: boolean;
  }[];
  ballScores: number[];
  totalScore: number;
  currentBallType: "GOLD" | "REGULAR";
}

export interface RedemptionRecord {
  serialNumber: number;
  date: string;
  time: string;
  timestamp: number;
}

export interface AdminStatsData {
  totalRedemptions: number;
  todayRedemptions: number;
  lastRedemptionTime: string;
  statsStartTime: string;
  records: RedemptionRecord[];
}
