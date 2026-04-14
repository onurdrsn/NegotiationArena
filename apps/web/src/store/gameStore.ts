import { create } from 'zustand';
import { ModeId, RoundMessage, FinalResult } from '@arena/shared';

interface CharacterInfo {
  name: string;
  title: string;
}

interface GameState {
  sessionId: string | null;
  modeId: ModeId | null;
  character: CharacterInfo | null;
  openingMessage: string | null;
  round: number;
  messages: RoundMessage[];
  isGameActive: boolean;
  finalResult: FinalResult | null;

  setGameSession: (sessionId: string, modeId: ModeId, character: CharacterInfo, openingMessage: string) => void;
  addMessage: (msg: RoundMessage) => void;
  setRound: (r: number) => void;
  endGame: (result: FinalResult) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  sessionId: null,
  modeId: null,
  character: null,
  openingMessage: null,
  round: 1,
  messages: [],
  isGameActive: false,
  finalResult: null,

  setGameSession: (sessionId, modeId, character, openingMessage) => set({
    sessionId, modeId, character, openingMessage, round: 1, messages: [], isGameActive: true, finalResult: null
  }),

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg]
  })),

  setRound: (r) => set({ round: r }),

  endGame: (result) => set({
    isGameActive: false,
    finalResult: result
  }),

  resetGame: () => set({
    sessionId: null,
    modeId: null,
    character: null,
    openingMessage: null,
    round: 1,
    messages: [],
    isGameActive: false,
    finalResult: null
  })
}));

