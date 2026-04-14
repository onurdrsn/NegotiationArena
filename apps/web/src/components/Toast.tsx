import { useToast } from '../hooks/useToast';
import { useEffect, useState } from 'react';

export default function Toast() {
  const { message, type, isVisible, hideToast } = useToast();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 500); // Wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show) return null;

  const typeConfig = {
    success: {
      bg: 'bg-green-950/20',
      border: 'border-green-500/50',
      text: 'text-green-400',
      icon: '✓',
      accent: 'bg-green-500'
    },
    error: {
      bg: 'bg-red-950/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      icon: '⚠',
      accent: 'bg-red-500'
    },
    info: {
      bg: 'bg-blue-950/20',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      icon: 'ℹ',
      accent: 'bg-blue-500'
    }
  };

  const config = typeConfig[type];

  return (
    <div 
      className={`fixed top-6 right-6 z-[9999] transition-all duration-500 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'
      }`}
    >
      <div className={`${config.bg} ${config.border} border backdrop-blur-md p-4 min-w-[300px] shadow-2xl flex items-center gap-4 relative overflow-hidden group`}>
        {/* Animated Progress Bar at bottom */}
        {isVisible && (
          <div className={`absolute bottom-0 left-0 h-0.5 ${config.accent} animate-[toast-progress_3s_linear]`}></div>
        )}
        
        {/* Status Icon */}
        <div className={`w-8 h-8 rounded-none border ${config.border} flex items-center justify-center font-mono font-bold ${config.text}`}>
          {config.icon}
        </div>

        {/* Message Content */}
        <div className="flex-1">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-0.5">Sistem Bildirimi</p>
          <p className={`font-mono text-sm font-bold ${config.text} leading-tight`}>{message}</p>
        </div>

        {/* Close Button */}
        <button 
          onClick={hideToast}
          className="text-gray-600 hover:text-white transition-colors font-mono text-xs"
        >
          [X]
        </button>

        {/* Cyber-UI corner accent */}
        <div className={`absolute top-0 right-0 w-2 h-2 ${config.accent} opacity-20`}></div>
      </div>
    </div>
  );
}

// Add these to your global CSS or styles for the progress animation
// @keyframes toast-progress {
//   from { width: 100%; }
//   to { width: 0%; }
// }
