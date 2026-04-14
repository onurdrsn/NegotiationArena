export type ModeId = string;
export type CharacterType = string;
export type Outcome = 'success' | 'partial' | 'failure';
export type Difficulty = 'normal' | 'hard';

export interface GameSession {
  sessionId: string;
  modeId: ModeId;
  characterType: CharacterType;
  round: number;
  messages: RoundMessage[];
}

export interface RoundMessage {
  round: number;
  userMessage: string;
  aiResponse: string;
  roundScore: number;
  feedback: string;
}

export interface FinalResult {
  finalScore: number;
  outcome: Outcome;
  roundScores: number[];
  characterFeedback: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number;
  gamesPlayed: number;
  bestScore: number;
  modeId?: ModeId;
}
