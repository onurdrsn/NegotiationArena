import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/select-mode');
  }, [user, navigate]);

  return (
    <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center justify-center min-h-[80vh]">
      <div className="max-w-3xl">
        <h1 className="text-6xl md:text-8xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-yellow)] to-[var(--color-accent-red)]">
          NEGOTIATION ARENA
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-10 font-mono">
          Baskı altında ne kadar iyisin? Gerçekçi senaryolarda yapay zeka karakterlerle metin tabanlı müzakere et, ikna et veya boyun eğ.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link to="/select-mode" className="px-8 py-4 bg-white text-black font-bold uppercase text-lg tracking-wider hover:bg-gray-200 transition-colors rounded-none">
              Oyuna Başla
            </Link>
          ) : (
            <Link to="/auth" className="px-8 py-4 bg-[var(--color-accent-yellow)] text-black font-bold uppercase text-lg tracking-wider hover:bg-yellow-400 transition-colors rounded-none">
              Mahkemeye Katıl
            </Link>
          )}
          <Link to="/leaderboard" className="px-8 py-4 border-2 border-white text-white font-bold uppercase text-lg tracking-wider hover:bg-white hover:text-black transition-colors rounded-none">
            Sıralamalar
          </Link>
        </div>
      </div>
    </div>
  );
}
