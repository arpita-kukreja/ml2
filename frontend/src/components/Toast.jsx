import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className={`fixed top-24 right-6 z-50 animate-prism-in`}>
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${typeStyles[type]}`}>
        <span className="text-xl">{icons[type]}</span>
        <p className="text-sm font-bold">{message}</p>
        <button 
          onClick={onClose}
          className="ml-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
