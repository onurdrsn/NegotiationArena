import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { rpc } from '../lib/rpc';

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  authorName: string;
  playCount: number;
  likeCount: number;
}

export default function Community() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const res = await rpc.api.scenarios.community.$get();
        if (res.ok) {
          const data = await res.json();
          // Types are temporarily forced until RPC types fully catch up in index.ts
          setScenarios(data as unknown as Scenario[]);
        }
      } catch (err) {
        console.error("Senaryolar yüklenemedi", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScenarios();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold">TOPLULUK</h1>
          <p className="font-mono text-gray-400 mt-1">Diğer uzmanların yarattığı krizlere müdahale et.</p>
        </div>
        <Link
          to="/create-scenario"
          className="hidden sm:flex items-center gap-2 border border-blue-500/30 text-blue-400 bg-blue-500/10 px-4 py-2 font-mono text-sm uppercase tracking-widest hover:bg-blue-500/20 hover:border-blue-500 transition-colors"
        >
          + Yeni Geliştir
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 font-mono text-gray-500 animate-pulse">
          Senaryolar yükleniyor...
        </div>
      ) : scenarios.length === 0 ? (
        <div className="flex justify-center py-20 font-mono text-gray-500 border border-gray-800 bg-[#0a1628]">
          Henüz kimse bir senaryo yayımlamadı. İlk sen ol!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {scenarios.map(scenario => (
            <div key={scenario.id} 
                 className="bg-[#0a1628] border-l-4 border-gray-700 p-6 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-4xl grayscale transition-all">{scenario.icon}</div>
                  <div className="text-xs font-mono text-[var(--color-accent-yellow)] bg-yellow-500/10 px-2 py-1 rounded">
                    ❤️ {scenario.likeCount} Likes
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1 text-white">{scenario.title}</h3>
                <p className="font-mono text-[10px] text-[var(--color-accent-green)] uppercase tracking-widest mb-3">Yazar: {scenario.authorName || 'Anonim'}</p>
                <p className="font-mono text-gray-400 text-sm line-clamp-2">{scenario.subtitle}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-500">▶ {scenario.playCount} oynanma</span>
                <Link to={`/game?custom=${scenario.id}`} className="text-sm font-bold uppercase tracking-widest text-white hover:text-[var(--color-accent-yellow)] transition-colors">
                  Oyna {'>'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
