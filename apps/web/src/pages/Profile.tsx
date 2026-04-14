import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { rpc } from '../lib/rpc';
import { useToast } from '../hooks/useToast';


interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  email: string;
  totalScore: number;
  gamesPlayed: number;
  googleId: string | null;
  isEmailVerified: boolean;
  emailNotificationsEnabled: boolean;
}

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [savingSync, setSavingSync] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await rpc.api.leaderboard.me.$get();
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user as ProfileData);
        }
      } catch { /* */ }
      finally { setFetching(false); }
    };
    if (user) fetch_();
  }, [user]);

  const handleToggleEmail = async () => {
    if (!profile || savingSync) return;
    const newVal = !profile.emailNotificationsEnabled;
    setSavingSync(true);
    setProfile({ ...profile, emailNotificationsEnabled: newVal });
    try {
      await rpc.api.user.settings.$patch({
        json: { emailNotificationsEnabled: newVal }
      });
      showToast("Bildirim tercihleri başarıyla güncellendi.", "success");
    } catch {
      // Revert on error
      setProfile({ ...profile, emailNotificationsEnabled: !newVal });
      showToast("Ayar senkronizasyon hatası: Değişiklik kaydedilemedi.", "error");
    } finally {
      setSavingSync(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="font-mono text-gray-500 animate-pulse">Profil yükleniyor...</div>
      </div>
    );
  }

  if (!profile) return null;

  const avgScore = profile.gamesPlayed > 0
    ? Math.round(profile.totalScore / profile.gamesPlayed)
    : 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Header card */}
      <div className="bg-[#0a1628] border border-gray-800 p-8 mb-6 relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-accent-yellow)]" />
        <div className="pl-4">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Uzman Profili</p>
          <h1 className="text-4xl font-black text-white mb-1">{profile.displayName}</h1>
          <p className="font-mono text-gray-400 text-sm">@{profile.username}</p>
          <p className="font-mono text-gray-600 text-xs mt-1">{profile.email}</p>

          <div className="flex items-center gap-3 mt-4">
            {profile.googleId && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google ile bağlı
              </span>
            )}
            {profile.isEmailVerified && (
              <span className="text-xs font-mono bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 text-[var(--color-accent-green)] px-2 py-1">
                ✓ E-posta doğrulandı
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Toplam Puan', value: profile.totalScore.toLocaleString(), color: 'text-[var(--color-accent-green)]' },
          { label: 'Oynanan Maç', value: profile.gamesPlayed, color: 'text-[var(--color-accent-yellow)]' },
          { label: 'Ort. Puan', value: avgScore, color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0a1628] border border-gray-800 p-5 text-center">
            <div className={`text-3xl font-black font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Settings & actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0a1628] border border-gray-800 p-6 flex flex-col gap-3">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Ayarlar & İşlemler</p>

          <label className="flex items-center justify-between p-3 border border-gray-700 hover:border-gray-500 transition-colors font-mono text-sm cursor-pointer mt-1">
            <span className="select-none">Görev Bülteni Bildirimleri</span>
            <div className={`w-10 h-5 border border-gray-500 flex items-center p-0.5 transition-colors ${profile.emailNotificationsEnabled ? 'bg-[var(--color-accent-yellow)] border-[var(--color-accent-yellow)]' : 'bg-transparent'}`}>
              <div className={`w-3.5 h-3.5 bg-white transition-transform ${profile.emailNotificationsEnabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
            </div>
            {/* hidden checkbox */}
            <input
              type="checkbox"
              className="hidden"
              checked={profile.emailNotificationsEnabled}
              onChange={handleToggleEmail}
              disabled={savingSync}
            />
          </label>

          <a
            href="/select-mode"
            className="flex items-center justify-between p-3 border border-gray-700 hover:border-[var(--color-accent-yellow)] hover:text-[var(--color-accent-yellow)] transition-colors font-mono text-sm"
          >
            <span>Yeni Oyun Başlat</span>
            <span>→</span>
          </a>

          <button
            onClick={async () => {
              await logout();
              navigate('/auth');
            }}
            className="flex items-center justify-between p-3 border border-red-900/50 bg-red-950/10 text-red-500 hover:bg-red-500 hover:text-black transition-all font-mono text-xs font-bold uppercase tracking-widest mt-2"
          >
            <span>Güvenli Çıkış (Logout)</span>
            <span>[X]</span>
          </button>
        </div>

        <div className="bg-[#0a1628] border border-gray-800 p-6">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Performans</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                <span>Ortalama Başarı</span>
                <span>{avgScore}/100</span>
              </div>
              <div className="h-1.5 bg-gray-800 w-full">
                <div
                  className="h-full bg-[var(--color-accent-green)] transition-all duration-700"
                  style={{ width: `${Math.min(avgScore, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
