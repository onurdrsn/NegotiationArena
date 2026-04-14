import { FinalResult } from '@arena/shared';
import { Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export default function ScoreScreen({ result, isEmbedded }: { result: FinalResult; isEmbedded?: boolean }) {
  const isSuccess = result.outcome === 'success';
  const { resetGame } = useGameStore();
  const navigate = useNavigate();

  const containerClasses = isEmbedded 
    ? "bg-[#0a1628] border-2 border-gray-800 p-8 w-full text-center flex flex-col items-center mt-8 relative overflow-hidden"
    : "min-h-[80vh] flex items-center justify-center container mx-auto px-4";

  const wrapperClasses = isEmbedded ? "" : "bg-[#0a1628] border-2 border-gray-800 p-12 max-w-2xl w-full text-center flex flex-col items-center shadow-2xl relative overflow-hidden";

  return (
    <div className={containerClasses}>
      <div className={wrapperClasses}>
        
        {/* Animated background glow depending on outcome */}
        <div className={`absolute top-0 left-0 right-0 h-2 w-full ${isSuccess ? 'bg-[var(--color-accent-green)] shadow-[0_0_40px_var(--color-accent-green)]' : 'bg-[var(--color-accent-red)] shadow-[0_0_40px_var(--color-accent-red)]'}`} />

        <div className="flex flex-col items-center mb-6">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Final Skor</p>
          <h1 className="text-6xl font-black border-b border-gray-800 pb-4 w-full px-10">
            {result.finalScore}
          </h1>
        </div>

        <div className="flex gap-4 w-full justify-center mb-8 flex-wrap">
          {result.roundScores.map((score, i) => (
            <div key={i} className="flex flex-col items-center bg-[#050810] border border-gray-800 p-4 w-24">
              <span className="text-[10px] text-gray-500 font-mono mb-2">TUR {i + 1}</span>
              <span className={`text-xl font-bold font-mono ${score >= 70 ? 'text-[var(--color-accent-green)]' : 'text-gray-300'}`}>{score}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#050810] border-l-4 border-[var(--color-accent-yellow)] p-6 w-full text-left font-mono text-gray-300 mb-8">
          <p className="font-bold text-[var(--color-accent-yellow)] mb-2 uppercase text-xs">{'>'}SİSTEM DEĞERLENDİRMESİ:</p>
          <p className="text-sm leading-relaxed">{result.characterFeedback}</p>
        </div>

        <h2 className={`text-2xl font-bold uppercase tracking-widest mb-10 ${isSuccess ? 'text-[var(--color-accent-green)]' : (result.outcome === 'partial' ? 'text-[var(--color-accent-yellow)]' : 'text-[var(--color-accent-red)]')}`}>
          {isSuccess ? 'BAŞARILI' : (result.outcome === 'partial' ? 'KISMİ BAŞARI' : 'BAŞARISIZ')}
        </h2>

        <div className="flex gap-4">
          <button 
            onClick={() => {
              resetGame();
              navigate('/select-mode');
            }}
            className="px-8 py-4 bg-white text-black font-bold uppercase text-xs tracking-widest hover:bg-gray-300 transition-colors"
          >
            Yeni Dosya Başlat
          </button>
          <Link to="/leaderboard" className="px-8 py-4 border border-gray-600 hover:border-white transition-colors uppercase text-xs tracking-widest text-gray-400">
            Sıralamalar
          </Link>
        </div>
      </div>
    </div>
  );
}
