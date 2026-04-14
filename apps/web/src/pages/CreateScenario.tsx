import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rpc } from '../lib/rpc';
import { useToast } from '../hooks/useToast';

export default function CreateScenario() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    icon: '🔥',
    characterName: '',
    characterTitle: '',
    systemPrompt: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create drafted scenario
      const res = await rpc.api.scenarios.$post({ json: formData });
      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || "Kayıt oluşturulamadı.");
      }
      const data = await res.json();
      
      // 2. Automatically request publish (AI moderation check)
      const pubRes = await rpc.api.scenarios[':id'].publish.$post({ param: { id: (data as any).id }});
      if (!pubRes.ok) {
        const errObj = await pubRes.json();
        throw new Error(errObj.error || "Yayımlama başarısız (Moderasyon engeli).");
      }

      showToast("Senaryo başarıyla yayımlandı!", "success");
      navigate('/select-mode'); // Redirect back to files
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold uppercase mb-2">Senaryo Yarat</h1>
        <p className="font-mono text-gray-400">Yapay zekaya yeni bir karakter ve müzakere krizi öğret. (AI moderasyonundan geçer)</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0a1628] border border-gray-800 p-8 flex flex-col gap-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 font-mono text-sm p-4">
            HATA: {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-1.5">İkon (Emoji)</label>
            <input 
              required
              className="w-full bg-[#050810] border border-gray-700 p-3 outline-none focus:border-[var(--color-accent-yellow)] font-mono text-xl text-center"
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
            />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-1.5">Senaryo Başlığı</label>
            <input 
              required placeholder="Örn: Hacker Fidye Talebi"
              className="w-full bg-[#050810] border border-gray-700 p-3 outline-none focus:border-[var(--color-accent-yellow)] font-mono"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-1.5">Senaryo Özeti</label>
          <input 
            required placeholder="Örn: Şirket verileri sızdırıldı, fidyeci ile pazarlık yap."
            className="w-full bg-[#050810] border border-gray-700 p-3 outline-none focus:border-[var(--color-accent-yellow)] font-mono"
            value={formData.subtitle}
            onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-6">
          <div>
            <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-1.5">Karakter Adı</label>
            <input 
              required placeholder="Örn: X-Anonymous"
              className="w-full bg-[#050810] border border-gray-700 p-3 outline-none focus:border-[var(--color-accent-yellow)] font-mono"
              value={formData.characterName}
              onChange={(e) => setFormData({...formData, characterName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-1.5">Karakter Unvanı / Rolü</label>
            <input 
              required placeholder="Örn: Siber Korsan"
              className="w-full bg-[#050810] border border-gray-700 p-3 outline-none focus:border-[var(--color-accent-yellow)] font-mono"
              value={formData.characterTitle}
              onChange={(e) => setFormData({...formData, characterTitle: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-xs font-mono text-[var(--color-accent-yellow)] uppercase tracking-widest mb-1.5">
            <span>Yapay Zeka Talimatı (Prompt)</span>
            <span className="text-gray-500 text-[10px]">Gizli bilgi tutulur</span>
          </label>
          <textarea 
            required rows={6}
            placeholder="Sen bir Siber Korsansın. Şirket verilerini sızdırmakla tehdit ediyorsun. Yalnızca mantıklı ödeme planlarını kabul et ve pazarlık edenle dalga geç. Max 3 cümle yaz."
            className="w-full bg-[#050810] border border-gray-700 p-3 outline-none focus:border-[var(--color-accent-yellow)] font-mono text-sm resize-y"
            value={formData.systemPrompt}
            onChange={(e) => setFormData({...formData, systemPrompt: e.target.value})}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 bg-[var(--color-accent-yellow)] text-black py-4 font-bold uppercase tracking-widest hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {loading ? 'Yapay Zeka İnceliyor...' : 'Senaryoyu Üret ve Yayımla'}
        </button>
      </form>
    </div>
  );
}
