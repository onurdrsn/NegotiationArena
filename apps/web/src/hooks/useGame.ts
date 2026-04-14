import { rpc } from '../lib/rpc';
import { useGameStore } from '../store/gameStore';
import { ModeId } from '@arena/shared';

export function useGame() {
  const { sessionId, setGameSession, addMessage, setRound, endGame, resetGame } = useGameStore();

  const startGame = async (modeId: ModeId) => {
    const res = await rpc.api.game.start.$post({
      json: { modeId, difficulty: 'normal' }
    });
    if (!res.ok) throw new Error("Could not start game");
    const data = await res.json();
    setGameSession(data.sessionId, modeId, data.character, data.openingMessage ?? '');
    return data;
  };

  const sendMessage = async (message: string) => {
    if (!sessionId) return;
    
    const res = await rpc.api.game.message.$post({
      json: { sessionId, message }
    });
    
    if (!res.ok) throw new Error("Message failed");
    const data = await res.json();
    
    addMessage({
      round: data.round,
      userMessage: message,
      aiResponse: data.aiMessage,
      roundScore: data.roundScore,
      feedback: data.feedback
    });
    
    if (data.isLastRound) {
      await finishGame();
    } else {
      setRound(data.round + 1);
    }
    
    return data;
  };

  const finishGame = async () => {
    if (!sessionId) return;
    const res = await rpc.api.game.end.$post({
      json: { sessionId }
    });
    if (!res.ok) throw new Error("Failed to end game");
    const result = await res.json();
    endGame(result);
    return result;
  };

  return { startGame, sendMessage, finishGame, resetGame };
}
