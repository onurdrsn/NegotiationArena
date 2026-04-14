import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';

export default function MultiplayerLobby() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<string>('Bağlanılıyor...');
  const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const modeId = searchParams.get('modeId') || 'random';

    // Protokolü düzgün ayarla
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Vite dev server'da genelde worker 8787/8788 üzerindedir. .env'den okumalı:
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
    const wsUrl = `${baseUrl.replace(/^http/, 'ws')}/api/multiplayer/connect?modeId=${modeId}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setStatus('Bağlandı. Eşleşme bekleniyor...');
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WAITING') {
          setStatus(data.message);
        } else if (data.type === 'MATCH_FOUND') {
          setStatus(data.message);
          setRoomId(data.roomId);
          setMessages(prev => [...prev, { sender: 'SİSTEM', text: 'Müzakere odası kuruldu. Karşınızda gerçek bir uzman var!' }]);
        } else if (data.type === 'CHAT') {
          setMessages(prev => [...prev, { sender: 'Rakip', text: data.content }]);
        } else if (data.type === 'OPPONENT_DISCONNECTED') {
          setMessages(prev => [...prev, { sender: 'SİSTEM', text: 'UYARI: Rakip bağlantıyı kopardı veya kaçtı.' }]);
          setStatus('Rakip Ayrıldı');
          setRoomId(null);
        }
      } catch (err) {
        console.error('WS Data parsing error:', err);
      }
    };

    ws.current.onclose = () => {
      setStatus('Bağlantı kesildi.');
      setRoomId(null);
    };

    return () => {
      ws.current?.close();
    };
  }, [user, searchParams]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws.current || !roomId) return;

    ws.current.send(JSON.stringify({
      roomId,
      content: input
    }));

    setMessages(prev => [...prev, { sender: 'Sen', text: input }]);
    setInput('');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-widest text-[var(--color-accent-yellow)] border-b-2 border-yellow-500/30 pb-2">VS ARENA</h1>
        </div>
        <div className="px-4 py-2 border border-gray-700 bg-[#050810] font-mono text-sm">
          Durum: <span className={roomId ? "text-[var(--color-accent-green)]" : "text-blue-400 animate-pulse"}>{status}</span>
        </div>
      </div>

      <div className="bg-[#0a1628] border border-gray-800 h-[60vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center font-mono text-gray-600 text-sm">
              Henüz mesaj yok. Rakip bağlanınca sohbet başlar.
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === 'Sen' ? 'items-end' : 'items-start'}`}>
                <span className={`text-[10px] font-mono mb-1 ${msg.sender === 'SİSTEM' ? 'text-yellow-500' : 'text-gray-500'}`}>{msg.sender}</span>
                <div className={`p-3 max-w-[80%] font-mono text-sm ${msg.sender === 'Sen' ? 'bg-[var(--color-accent-yellow)] text-black' : msg.sender === 'SİSTEM' ? 'bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 w-full text-center' : 'bg-gray-800 text-gray-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 bg-[#050810] flex gap-3">
          <input
            disabled={!roomId}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={roomId ? "Rakibe argümanını ilet..." : "Bağlantı bekleniyor..."}
            className="flex-1 bg-transparent border border-gray-700 p-3 font-mono outline-none focus:border-[var(--color-accent-yellow)] disabled:opacity-50"
          />
          <button disabled={!roomId || !input.trim()} type="submit" className="px-6 border border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] font-bold uppercase tracking-widest hover:bg-[var(--color-accent-yellow)] hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--color-accent-yellow)]">
            Gönder
          </button>
        </form>
      </div>
    </div>
  );
}
