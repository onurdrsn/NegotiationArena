export default function RoundIndicator({ currentRound, maxRounds }: { currentRound: number; maxRounds: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: maxRounds }).map((_, i) => {
        const active = i + 1 <= currentRound;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`h-2 w-8 border ${active ? 'bg-[var(--color-accent-green)] border-[var(--color-accent-green)] shadow-[0_0_8px_rgba(0,255,136,0.8)]' : 'bg-transparent border-gray-700'} transition-all duration-300`} />
            {i + 1 === currentRound && <span className="text-[10px] text-gray-400 font-mono">TUR {i + 1}</span>}
          </div>
        );
      })}
    </div>
  );
}
