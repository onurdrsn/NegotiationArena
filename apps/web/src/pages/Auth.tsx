import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [mode, setMode] = useState<'auth' | 'verify' | 'forgot' | 'reset' | 'google-complete'>('auth');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  
  // Google Complete Mode
  const [googleId, setGoogleId] = useState('');
  const [oauthErrorMsg, setOauthErrorMsg] = useState('');

  // Resend logic
  const [resendWait, setResendWait] = useState(0);
  const [resendMultiplier, setResendMultiplier] = useState(1);

  const { user, login, register, verifyEmail, resendVerification, forgotPassword, resetPassword, completeGoogleAuth, loading, error, requireVerification, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gid = params.get('googleId');
    const gemail = params.get('email');
    const oauthError = params.get('error');

    if (gid && gemail) {
      setGoogleId(gid);
      setEmail(gemail);
      setMode('google-complete');
    } else if (oauthError) {
      const messages: Record<string, string> = {
        google_denied: 'Google ile giriş iptal edildi.',
        google_token_failed: 'Google kimlik doğrulama başarısız oldu. Lütfen tekrar deneyin.',
        google_userinfo_failed: 'Google hesap bilgileri alınamadı. Lütfen tekrar deneyin.',
      };
      // Push the error into useAuth's error state via a native event hack-free approach:
      // We just set a local error display state
      setOauthErrorMsg(messages[oauthError] ?? 'Google ile giriş sırasında bir hata oluştu.');
    }
  }, [location]);

  useEffect(() => {
    if (requireVerification) setMode('verify');
    else if (user && mode !== 'google-complete' && mode !== 'verify') {
      navigate('/select-mode');
    }
  }, [requireVerification, user, mode, navigate]);

  useEffect(() => {
    if (resendWait > 0) {
      const t = setTimeout(() => setResendWait(w => w - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendWait]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (mode === 'google-complete') {
      const user = await completeGoogleAuth({ googleId, email, username, displayName, password });
      if (user) navigate('/select-mode');
      return;
    }

    if (mode === 'verify') {
      const user = await verifyEmail(code);
      if (user) navigate('/select-mode');
      return;
    }

    if (mode === 'forgot') {
      const ok = await forgotPassword(email);
      if (ok) setMode('reset');
      return;
    }

    if (mode === 'reset') {
      const ok = await resetPassword({ email, code, newPassword: password });
      if (ok) {
        setMode('auth');
        setIsLogin(true);
      }
      return;
    }

    // Default Auth
    if (isLogin) {
      const result = await login({ email, password });
      if (result) navigate('/select-mode');
    } else {
      const result = await register({ email, password, username, displayName });
      if (result && !('requireVerification' in result)) navigate('/select-mode');
    }
  };

  const handleResend = async () => {
    if (resendWait > 0) return;
    await resendVerification();
    setResendWait(30 * resendMultiplier);
    setResendMultiplier(m => m * 2);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl bg-[#0a1628] border border-gray-800 p-8 shadow-2xl">
        
        <div className="flex flex-col justify-center border-r border-gray-800 pr-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            {mode === 'verify' ? 'Hesabı Doğrula' : 
             mode === 'forgot' ? 'Şifre Kurtarma' : 
             mode === 'reset' ? 'Yeni Şifre' : 
             mode === 'google-complete' ? 'Kaydı Tamamla' : 
             'Kimliğini Doğrula'}
          </h2>
          <p className="text-gray-400 font-mono text-sm leading-relaxed">
            {mode === 'verify' ? 'Güvenlik protokolü gereği, sistem yetkililerine iletilen 6 haneli erişim kodunu girmen gerekiyor.' : 
             mode === 'forgot' ? 'Sistem kayıtlarındaki e-posta adresini gir. Eğer eşleşme sağlanırsa sıfırlama yönergesi iletilecektir.' :
             mode === 'google-complete' ? 'Google kimliğin doğrulandı. Ancak arenaya katılabilmen için bir takma ad ve şifreye ihtiyacın var.' :
             'Müzakere masasına oturmadan önce yetkilerini sisteme tanımla. Başarısızlık durumunda tüm sorumluluk sana aittir.'}
          </p>
        </div>

        <div>
          {(mode === 'auth') && (
            <div className="flex flex-col gap-4 mb-6">
              {oauthErrorMsg && (
                <div className="bg-red-500/20 text-red-400 p-3 text-sm font-mono border border-red-500/50">
                  {oauthErrorMsg}
                </div>
              )}
              <a 
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/auth/google`}
                className="flex items-center justify-center p-3 font-bold uppercase tracking-widest text-[#0a1628] bg-white hover:bg-gray-200 transition-colors"
                onClick={() => setOauthErrorMsg('')}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google ile {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              </a>
              
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-700"></div>
                <span className="px-4 text-xs font-mono text-gray-500">VEYA</span>
                <div className="flex-1 border-t border-gray-700"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <div className="bg-red-500/20 text-red-400 p-3 text-sm font-mono border border-red-500/50">{error}</div>}
            
            {mode === 'auth' && (
              <>
                {!isLogin && (
                  <>
                    <div className="flex flex-col gap-1">
                      <input type="text" placeholder="Kullanıcı Adı" required value={username} onChange={e => setUsername(e.target.value)} 
                             className="bg-[#050810] border border-gray-700 p-3 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
                      <p className="text-xs font-mono text-gray-600 px-1">Yalnızca küçük harf, rakam ve _ (en az 3 karakter)</p>
                    </div>
                    <input type="text" placeholder="Görünen İsim" required value={displayName} onChange={e => setDisplayName(e.target.value)} 
                           className="bg-[#050810] border border-gray-700 p-3 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
                  </>
                )}
                <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} 
                       className="bg-[#050810] border border-gray-700 p-3 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
                <div className="flex flex-col gap-1">
                  <input type="password" placeholder="Şifre" required value={password} onChange={e => setPassword(e.target.value)} 
                         className="bg-[#050810] border border-gray-700 p-3 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
                  {!isLogin && (
                    <p className="text-xs font-mono text-gray-600 px-1">Min. 8 karakter · Büyük harf · Küçük harf · Rakam</p>
                  )}
                </div>
              </>
            )}

            {mode === 'google-complete' && (
              <>
                 <input type="email" value={email} disabled
                       className="bg-gray-900 text-gray-500 border border-gray-800 p-3 font-mono cursor-not-allowed" />
                 <input type="text" placeholder="Kullanıcı Adı Seçin" required value={username} onChange={e => setUsername(e.target.value)} 
                       className="bg-[#050810] border border-gray-700 p-3 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
                 <input type="text" placeholder="Görünen İsim" required value={displayName} onChange={e => setDisplayName(e.target.value)} 
                       className="bg-[#050810] border border-gray-700 p-3 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
                 <input type="password" placeholder="Şifrenizi Belirleyin" required value={password} onChange={e => setPassword(e.target.value)} 
                       className="bg-[#050810] border border-gray-700 p-3 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
              </>
            )}

            {(mode === 'verify' || mode === 'reset') && (
              <>
                <input type="text" placeholder="6 Haneli Kod" required maxLength={6} value={code} onChange={e => setCode(e.target.value)} 
                       className="bg-[#050810] border border-gray-700 p-3 font-mono text-center tracking-widest text-2xl focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
              </>
            )}

            {mode === 'reset' && (
              <input type="password" placeholder="Yeni Şifre" required value={password} onChange={e => setPassword(e.target.value)} 
                     className="bg-[#050810] border border-gray-700 p-3 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
            )}

            {mode === 'forgot' && (
              <input type="email" placeholder="Email Adresiniz" required value={email} onChange={e => setEmail(e.target.value)} 
                     className="bg-[#050810] border border-gray-700 p-3 font-mono focus:border-[var(--color-accent-yellow)] outline-none transition-colors" />
            )}

            <button disabled={loading} type="submit" 
                    className="mt-4 p-4 font-bold uppercase tracking-widest text-black bg-[var(--color-accent-green)] hover:bg-green-400 transition-colors disabled:opacity-50">
              {loading ? 'İşleniyor...' : 
               mode === 'verify' ? 'Doğrula' :
               mode === 'forgot' ? 'Kod Gönder' :
               mode === 'reset' ? 'Şifreyi Güncelle' :
               mode === 'google-complete' ? 'Kaydı Bitir' :
               isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>

          {/* EKSTRA BAĞLANTILAR */}
          <div className="mt-6 flex flex-col gap-2 text-center font-mono text-sm text-gray-500">
            {mode === 'auth' && (
              <>
                <div>
                  {isLogin ? "Yeni misin?" : "Zaten hesabın var mı?"} 
                  <button onClick={() => {
                    setIsLogin(!isLogin);
                    clearError();
                  }} className="ml-2 text-[var(--color-accent-yellow)] hover:underline">
                    {isLogin ? 'Dosya Aç' : 'Dosyaya Eriş'}
                  </button>
                </div>
                {isLogin && (
                  <button onClick={() => setMode('forgot')} className="text-gray-400 hover:text-white transition-colors">
                    Şifremi Unuttum
                  </button>
                )}
              </>
            )}

            {mode === 'verify' && (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleResend} 
                  disabled={resendWait > 0}
                  className="text-gray-400 hover:text-white disabled:text-gray-600 transition-colors"
                >
                  {resendWait > 0 ? `Yeni kod için bekle: ${resendWait}s` : 'Kodu Tekrar Gönder'}
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    await useAuth.getState().logout();
                    setMode('auth');
                    setIsLogin(true);
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors mt-4 text-xs font-bold font-mono tracking-widest"
                >
                  [ ÇIKIŞ YAP (BAŞKA HESAP) ]
                </button>
              </div>
            )}

            {(mode === 'forgot' || mode === 'reset' || mode === 'verify' || mode === 'google-complete') && (
              <button onClick={() => setMode('auth')} className="text-[var(--color-accent-yellow)] hover:underline mt-2">
                ← İptal Et ve Geri Dön
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
