import { useEffect } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
  const { globalData, fetchGlobal, loading } = useLeaderboard();

  useEffect(() => {
    fetchGlobal();
  }, [fetchGlobal]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold">LİDERLİK TABLOSU</h1>
        <Link to="/" className="text-sm font-mono border border-gray-700 px-4 py-2 hover:bg-white hover:text-black transition-colors">Geri Dön</Link>
      </div>

      {loading ? (
        <div className="text-center font-mono py-20">Veriler çekiliyor...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {globalData.map((user) => (
            <div key={user.userId} className="flex items-center bg-[#0a1628] border-l-4 border-gray-700 p-4 transition-all hover:bg-gray-800">
              <div className="w-16 text-2xl font-bold text-gray-500 font-mono">#{user.rank}</div>
              <div className="flex-1">
                <div className="font-bold text-xl text-[var(--color-accent-yellow)]">{user.displayName}</div>
                <div className="text-sm text-gray-500 font-mono">Oynanan Maç: {user.gamesPlayed}</div>
              </div>
              <div className="text-3xl font-black text-[var(--color-accent-green)] font-mono">
                {user.totalScore.toLocaleString()}
              </div>
            </div>
          ))}
          {globalData.length === 0 && (
            <div className="text-center font-mono py-20 text-gray-500">Sıralama verisi bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
}
