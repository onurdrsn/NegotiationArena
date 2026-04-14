import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_LINKS = [
  { to: '/',            label: 'Ana Sayfa',         icon: '⚡' },
  { to: '/select-mode', label: 'Dosyalar',           icon: '🗂️',  auth: true },
  { to: '/community',   label: 'Topluluk',           icon: '🌐',  auth: true },
  { to: '/leaderboard', label: 'Liderlik Tablosu',   icon: '🏆' },
  { to: '/profile',     label: 'Profil',             icon: '👤',  auth: true },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visibleLinks = NAV_LINKS.filter(l => !l.auth || user);

  return (
    <>
      {/* Fixed top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-gray-800/60 bg-[#050810]/80 backdrop-blur-md">
        <Link to="/" className="text-[var(--color-accent-yellow)] font-black text-lg tracking-widest uppercase">
          NEGOTIATION<span className="text-white"> ARENA</span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-6">
          {visibleLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`font-mono text-sm uppercase tracking-wider transition-colors hover:text-[var(--color-accent-yellow)] ${
                location.pathname === l.to ? 'text-[var(--color-accent-yellow)]' : 'text-gray-400'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link to="/auth" className="font-bold uppercase text-sm tracking-widest text-black bg-[var(--color-accent-yellow)] px-4 py-2 hover:bg-yellow-300 transition-colors">
              Giriş Yap
            </Link>
          )}
        </nav>

        {/* Hamburger button (mobile) */}
        <button
          id="hamburger-btn"
          onClick={() => setOpen(o => !o)}
          className="md:hidden flex flex-col gap-1.5 p-2 group"
          aria-label="Menüyü aç"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </header>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-[#0a1628] border-l border-gray-800 flex flex-col transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <span className="font-black text-[var(--color-accent-yellow)] tracking-wider uppercase text-sm">Menü</span>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">✕</button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-6 py-4 border-b border-gray-800 bg-[#050810]/50">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Hoş geldin</p>
            <p className="font-bold text-white">{user.displayName}</p>
            <p className="text-xs font-mono text-gray-500">@{user.username}</p>
          </div>
        )}

        {/* Links */}
        <nav className="flex-1 flex flex-col py-4">
          {visibleLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-4 px-6 py-4 font-mono text-sm uppercase tracking-wider transition-all border-l-2 ${
                location.pathname === l.to
                  ? 'border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/5'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              <span className="text-lg">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Bottom auth */}
        {!user && (
          <div className="px-6 py-5 border-t border-gray-800">
            <Link to="/auth" className="block w-full text-center font-bold uppercase text-sm tracking-widest text-black bg-[var(--color-accent-yellow)] px-4 py-3 hover:bg-yellow-300 transition-colors">
              Giriş Yap / Kayıt Ol
            </Link>
          </div>
        )}
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[65px]" />
    </>
  );
}
