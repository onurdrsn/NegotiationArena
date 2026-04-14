import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { ModeId } from '@arena/shared';
import { useToast } from '../hooks/useToast';

const MODES = [
  { id: 'kiyamet', title: 'Kıyameti Ertele', sub: 'Proje battı. Ekip seni suçluyor. Toplantıda ayakta kal.', icon: '🔥', color: 'border-red-500 hover:shadow-[0_0_20px_rgba(255,59,59,0.3)]' },
  { id: 'referans', title: 'Referans Oyunu', sub: 'Ayrıldığın eski patronu arıyorsun. Referans vermesini istiyorsun.', icon: '📞', color: 'border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
  { id: 'sikayet', title: 'Şikayeti Gömme', sub: 'Müşteri şikayet etti. Hem müşteriyi hem yönetimi idare et.', icon: '🚨', color: 'border-yellow-500 hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]' },
  { id: 'suc', title: 'Suçu Üstlenme', sub: 'Ekibin yaptığı hatayı sen mi üstleneceksin? Yönetim baskı yapıyor.', icon: '⚖️', color: 'border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
  { id: 'terfi', title: 'Terfi Kapışması', sub: 'Aynı pozisyon, iki aday. Biri sen, biri patronun gözdesi.', icon: '🎯', color: 'border-green-500 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]' },
];

export default function ModeSelect() {
  const { startGame } = useGame();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSelect = async (id: string) => {
    try {
      await startGame(id as ModeId);
      navigate('/game');
    } catch (e) {
      showToast("Oyun dosyası yüklenemedi. Lütfen tekrar deneyin.", "error");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold">DOSYALAR</h1>
          <p className="font-mono text-gray-400 mt-1">Bir kriz senaryosu seçin ve müzakereye başlayın.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/multiplayer"
            className="flex items-center gap-2 border border-yellow-500/50 text-[var(--color-accent-yellow)] bg-yellow-500/10 px-4 py-2 font-bold uppercase tracking-widest hover:bg-[var(--color-accent-yellow)] hover:text-black transition-colors shadow-[0_0_15px_rgba(251,188,5,0.2)]"
          >
            ⚔️ VS ARENA
          </Link>
          <Link
            to="/create-scenario"
            className="hidden sm:flex items-center gap-2 border border-blue-500/30 text-blue-400 bg-blue-500/10 px-4 py-2 font-mono text-sm uppercase tracking-widest hover:bg-blue-500/20 hover:border-blue-500 transition-colors"
          >
            + Yeni Geliştir
          </Link>
          <Link
            to="/leaderboard"
            className="hidden sm:flex items-center gap-2 border border-gray-700 px-4 py-2 font-mono text-sm uppercase tracking-widest text-gray-400 hover:border-[var(--color-accent-yellow)] hover:text-[var(--color-accent-yellow)] transition-colors"
          >
            🏆 Sıralamalar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {MODES.map(mode => (
          <div key={mode.id} 
               onClick={() => handleSelect(mode.id)}
               className={`bg-[#0a1628] border-l-4 ${mode.color} p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 group flex flex-col justify-between min-h-[220px]`}>
            <div>
              <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{mode.icon}</div>
              <h3 className="text-2xl font-bold mb-2 text-white">{mode.title}</h3>
              <p className="font-mono text-gray-400 text-sm">{mode.sub}</p>
            </div>
            <div className="mt-6 text-sm font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
              Seç {'>'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
