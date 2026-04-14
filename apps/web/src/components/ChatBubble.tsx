export default function ChatBubble({ text, isUser, roundScore, feedback }: { text: string; isUser: boolean; roundScore?: number; feedback?: string; }) {
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}>
      <span className="text-[10px] text-gray-500 font-mono mb-1">
        {isUser ? 'SİZ' : 'KARŞIT TARAF'}
      </span>
      
      <div className={`p-4 border ${isUser ? 'bg-[var(--color-dark-bg)] border-[var(--color-accent-yellow)] text-right rounded-bl-xl rounded-tl-xl rounded-tr-xl' : 'bg-[#1a2538] border-gray-700 text-left rounded-br-xl rounded-tr-xl rounded-tl-xl'} whitespace-pre-wrap break-words overflow-hidden`}>
        {text}
      </div>

      {isUser && roundScore !== undefined && (
        <div className="mt-2 text-xs font-mono flex items-center gap-2">
          <span className="bg-gray-800 border border-gray-700 px-2 py-1 text-gray-300">
            {feedback}
          </span>
          <span className={`font-black tracking-wider px-2 py-1 ${roundScore >= 70 ? 'text-[var(--color-accent-green)] bg-green-900/40 border border-[var(--color-accent-green)]' : roundScore >= 40 ? 'text-[var(--color-accent-yellow)] bg-yellow-900/40 border border-[var(--color-accent-yellow)]' : 'text-[var(--color-accent-red)] bg-red-900/40 border border-[var(--color-accent-red)]'}`}>
            SKOR: {roundScore}
          </span>
        </div>
      )}
    </div>
  );
}
