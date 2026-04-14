import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';
import ChatBubble from '../components/ChatBubble';
import RoundIndicator from '../components/RoundIndicator';
import ScoreScreen from '../components/ScoreScreen';
import { useToast } from '../hooks/useToast';

export default function Game() {
  const { character, openingMessage, messages, round, isGameActive, finalResult } = useGameStore();
  const { sendMessage, startGame } = useGame();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const customId = searchParams.get('custom');
    if (customId && !isGameActive) {
      setLoading(true);
      startGame(customId as any).then(() => {
        setLoading(false);
        navigate('/game', { replace: true });
      }).catch(() => {
        showToast("Senaryo dosyası eksik veya bozuk. Sistemden atıldınız.", "error");
        navigate('/community');
      });
    }
  }, [searchParams, isGameActive, startGame, navigate]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, openingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !isGameActive) return;
    
    setLoading(true);
    const msg = input;
    setInput('');
    try {
      await sendMessage(msg);
    } catch (e) {
      showToast("Bağlantı hatası: Mesaj iletilemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Removed early return to allow history viewing
  // if (finalResult) {
  //   return <ScoreScreen result={finalResult} />;
  // }

  return (
    <div className="h-screen flex flex-col container mx-auto px-4 py-8 max-w-4xl">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-[#0a1628] border border-gray-800 p-4 mb-4 shadow">
        <div>
          <h2 className="text-xl font-bold uppercase text-[var(--color-accent-yellow)]">{character?.name}</h2>
          <p className="font-mono text-sm text-gray-400">{character?.title}</p>
        </div>
        <RoundIndicator currentRound={round} maxRounds={3} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-[#0a1628]/50 border border-gray-800 p-6 flex flex-col gap-6">
        {/* Opening message from the character */}
        {openingMessage && (
          <ChatBubble text={openingMessage} isUser={false} />
        )}

        {messages.length === 0 && !openingMessage && (
          <div className="m-auto font-mono text-gray-500 text-center">
            Oturum başlatıldı. Karşınızdaki yetkili konuya giriş yapmanızı bekliyor.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-4">
            <ChatBubble text={msg.userMessage} isUser={true} roundScore={msg.roundScore} feedback={msg.feedback} />
            <ChatBubble text={msg.aiResponse} isUser={false} />
          </div>
        ))}
        {loading && <div className="font-mono text-gray-500 animate-pulse">{'>'} Analiz ediliyor...</div>}
        
        {/* Results summary at the bottom of history */}
        {finalResult && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <ScoreScreen result={finalResult} isEmbedded={true} />
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area - Only shows when game is active */}
      {isGameActive ? (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-4 text-[var(--color-accent-green)] font-mono font-bold">{'>'}</span>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              disabled={loading || !isGameActive}
              placeholder="Argümanını gir..."
              className="w-full bg-[#0a1628] border border-gray-700 pl-10 pr-4 py-4 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors disabled:opacity-50 resize-none min-h-[60px]"
              maxLength={1000}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !isGameActive || !input.trim()}
            className="bg-[var(--color-accent-green)] text-black px-8 font-bold uppercase tracking-widest hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            GÖNDER
          </button>
        </form>
      ) : (
        <div className="mt-6 p-4 border border-gray-800 bg-gray-950/20 text-center font-mono text-xs text-gray-500 uppercase tracking-widest animate-pulse">
          -- MÜZAKERE SONLANDIRILDI --
        </div>
      )}
    </div>
  );
}
